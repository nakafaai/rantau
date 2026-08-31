import { HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { components, internal } from "@repo/backend/convex/_generated/api";
import type { Doc, Id } from "@repo/backend/convex/_generated/dataModel";
import {
  internalAction,
  mutation,
  query,
} from "@repo/backend/convex/_generated/server";
import { discoverLane } from "@repo/backend/convex/lib/discover";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import { enqueueDiscoveryStage } from "@repo/backend/convex/lib/searchqueue";
import { searchPlace } from "@repo/backend/convex/lib/searchsession";
import {
  DISCOVERY_LANE_TIMEOUT_MS,
  type DiscoveryLaneResult,
  discoveryLaneResultValidator,
  SEARCH_TIMEOUT_MS,
} from "@repo/backend/convex/lib/searchwork";
import {
  pathwayValidator,
  placeScopeValidator,
  readinessStepValidator,
  workModeValidator,
} from "@repo/backend/convex/model";
import schema from "@repo/backend/convex/schema";
import {
  SEARCH_RESULT_LIMIT,
  SEARCH_RESULT_TARGET,
} from "@repo/domain/discoveryplan";
import type { Opportunity } from "@repo/domain/opportunity";
import { recommendationScore } from "@repo/domain/rank";
import { buildReadinessPlan } from "@repo/domain/readiness";
import {
  makeSearchIntent,
  SearchExecutionError,
  SearchIntent,
  SearchQuery,
} from "@repo/domain/search";
import { ConvexError, v } from "convex/values";
import { Effect } from "effect";

const rateLimiter = new RateLimiter(components.rateLimiter, {
  opportunitySearch: {
    capacity: 6,
    kind: "token bucket",
    period: HOUR,
    rate: 6,
  },
});

/** Projects one opportunity against the current candidate profile. */
function readinessProjection(
  profile: Doc<"profiles"> | null,
  opportunity: Doc<"opportunities">
) {
  const readiness = [
    ...buildReadinessPlan(
      profile
        ? {
            documents: profile.documents,
            education: profile.education,
            experienceYears: profile.experienceYears,
            languages: profile.languages,
            licenses: profile.licenses,
            skills: profile.skills,
          }
        : null,
      opportunity.opportunity.requirements
    ),
  ];

  return {
    hasProfile: profile !== null,
    opportunity,
    readiness,
  };
}

/** Copies Effect-decoded evidence into Convex-owned arrays and objects. */
function storedOpportunity(opportunity: Opportunity) {
  return {
    ...opportunity,
    applicationSteps: [...opportunity.applicationSteps],
    requirements: opportunity.requirements.map((requirement) => ({
      ...requirement,
    })),
    source: { ...opportunity.source },
    support: opportunity.support.map((resource) => ({ ...resource })),
  };
}

/** Creates one search and atomically hands every regional lane to Workpool. */
export const start = mutation({
  args: {
    locale: v.union(v.literal("en"), v.literal("id")),
    pathway: v.optional(pathwayValidator),
    place: v.optional(placeScopeValidator),
    query: v.string(),
    workMode: v.optional(workModeValidator),
  },
  returns: v.object({ searchId: v.id("searches") }),
  handler: async (ctx, args): Promise<{ searchId: Id<"searches"> }> => {
    const userId = await requireUserId(ctx);
    const intentResult = Effect.runSync(
      makeSearchIntent(args).pipe(Effect.result)
    );
    if (intentResult._tag === "Failure") {
      throw new ConvexError({
        code: "INVALID_SEARCH",
        message: intentResult.failure.message,
      });
    }
    const intent = intentResult.success;
    await rateLimiter.limit(ctx, "opportunitySearch", {
      key: userId,
      throws: true,
    });

    const createdAt = Date.now();
    const searchId = await ctx.db.insert("searches", {
      city: intent.place?.level === "city" ? intent.place.city : undefined,
      country: intent.place?.country,
      countryCode: intent.place?.countryCode,
      createdAt,
      locale: intent.locale,
      pathway: intent.pathway,
      query: intent.query,
      region:
        intent.place?.level === "region" || intent.place?.level === "city"
          ? intent.place.region
          : undefined,
      regionCode:
        intent.place?.level === "region" || intent.place?.level === "city"
          ? intent.place.regionCode
          : undefined,
      resultCount: 0,
      stage: "initial",
      status: "running",
      targetCount: SEARCH_RESULT_TARGET,
      userId,
      workMode: intent.workMode,
    });

    await Effect.runPromise(
      enqueueDiscoveryStage(ctx, searchId, userId, intent, "initial", createdAt)
    );
    await ctx.scheduler.runAfter(SEARCH_TIMEOUT_MS, internal.searches.expire, {
      searchId,
      userId,
    });

    return { searchId };
  },
});

/** Executes one isolated regional lane whose completion Workpool guarantees. */
export const executeLane = internalAction({
  args: {
    laneId: v.id("searchLanes"),
    searchId: v.id("searches"),
    userId: v.id("users"),
  },
  returns: discoveryLaneResultValidator,
  handler: async (ctx, args): Promise<DiscoveryLaneResult> => {
    const input = await ctx.runQuery(internal.searchinput.laneInput, args);
    await ctx.runMutation(internal.searchinput.markLaneRunning, {
      laneId: args.laneId,
      searchId: args.searchId,
      userId: args.userId,
    });
    const intent = SearchIntent.make({
      locale: input.locale,
      pathway: input.pathway,
      place: input.place,
      query: SearchQuery.make(input.query),
      workMode: input.workMode,
    });
    return Effect.runPromise(
      discoverLane(
        ctx,
        intent,
        {
          limit: input.limit,
          market: input.market,
          sourceQuery: input.sourceQuery,
        },
        args.userId,
        (opportunity): Promise<boolean> =>
          ctx.runMutation(internal.searches.append, {
            opportunity: storedOpportunity(opportunity),
            searchId: args.searchId,
            userId: args.userId,
          })
      ).pipe(
        Effect.timeoutOrElse({
          duration: DISCOVERY_LANE_TIMEOUT_MS,
          orElse: () =>
            Effect.fail(
              new SearchExecutionError({
                limitation: "deadline",
                message: `Opportunity discovery in ${input.market} exceeded its lane deadline.`,
                stage: "analysis",
              })
            ),
        }),
        Effect.match({
          onFailure: (error) => ({
            error: error.message,
            kind: "failed" as const,
            limitation:
              error._tag === "SearchExecutionError"
                ? error.limitation
                : "source_exhausted",
          }),
          onSuccess: (result) => ({
            ...result,
            kind: "success" as const,
          }),
        })
      )
    );
  },
});

/** Lists the complete bounded result set in recommendation order. */
export const list = query({
  args: { searchId: v.id("searches") },
  returns: v.array(
    v.object({
      hasProfile: v.boolean(),
      isSaved: v.boolean(),
      opportunity: schema.doc("opportunities"),
      recommendation: v.number(),
      readiness: v.array(readinessStepValidator),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const searchRecord = await ctx.db.get("searches", args.searchId);
    if (!searchRecord || searchRecord.userId !== userId) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }

    const [profile, opportunities, applications] = await Promise.all([
      ctx.db
        .query("profiles")
        .withIndex("by_user", (index) => index.eq("userId", userId))
        .unique(),
      ctx.db
        .query("opportunities")
        .withIndex("by_search", (index) => index.eq("searchId", args.searchId))
        .take(SEARCH_RESULT_LIMIT),
      ctx.db
        .query("applications")
        .withIndex("by_user_updatedAt", (index) => index.eq("userId", userId))
        .order("desc")
        .take(SEARCH_RESULT_LIMIT),
    ]);
    const savedOpportunityIds = new Set(
      applications.map((application) => application.opportunityId)
    );

    return opportunities
      .map((opportunity) => ({
        ...readinessProjection(profile, opportunity),
        isSaved: savedOpportunityIds.has(opportunity._id),
        recommendation: recommendationScore(
          opportunity.opportunity,
          {
            pathway: searchRecord.pathway,
            place: searchPlace(searchRecord),
            query: searchRecord.query,
            workMode: searchRecord.workMode,
          },
          profile
        ),
      }))
      .sort((left, right) => right.recommendation - left.recommendation);
  },
});
