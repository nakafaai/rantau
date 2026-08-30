import { HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { components, internal } from "@repo/backend/convex/_generated/api";
import type { Doc, Id } from "@repo/backend/convex/_generated/dataModel";
import {
  internalAction,
  mutation,
  query,
} from "@repo/backend/convex/_generated/server";
import {
  type DiscoveryRun,
  discoverLane,
  discoveryLanes,
} from "@repo/backend/convex/lib/discover";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import {
  discoveryLaneResultValidator,
  SEARCH_TIMEOUT_MS,
  searchWork,
} from "@repo/backend/convex/lib/searchwork";
import {
  pathwayValidator,
  readinessStepValidator,
  workModeValidator,
} from "@repo/backend/convex/model";
import schema from "@repo/backend/convex/schema";
import type { Opportunity } from "@repo/domain/opportunity";
import { recommendationScore } from "@repo/domain/rank";
import { buildReadinessPlan } from "@repo/domain/readiness";
import {
  makeSearchIntent,
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
    country: v.optional(v.string()),
    locale: v.union(v.literal("en"), v.literal("id")),
    pathway: v.optional(pathwayValidator),
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
      country: intent.country,
      createdAt,
      locale: intent.locale,
      pathway: intent.pathway,
      query: intent.query,
      resultCount: 0,
      status: "running",
      userId,
      workMode: intent.workMode,
    });

    await Effect.runPromise(
      Effect.forEach(
        discoveryLanes(intent),
        (lane) =>
          Effect.gen(function* () {
            const laneId = yield* Effect.promise(() =>
              ctx.db.insert("searchLanes", {
                market: lane.market,
                searchId,
                status: "queued",
                updatedAt: createdAt,
                userId,
              })
            );
            const workId = yield* Effect.promise(() =>
              searchWork.enqueueAction(
                ctx,
                internal.opportunities.executeLane,
                {
                  country: intent.country,
                  laneId,
                  limit: lane.limit,
                  locale: intent.locale,
                  market: lane.market,
                  pathway: intent.pathway,
                  query: intent.query,
                  searchId,
                  userId,
                  workMode: intent.workMode,
                },
                {
                  context: { laneId, searchId, userId },
                  onComplete: internal.searches.finishLane,
                  retry: false,
                }
              )
            );
            yield* Effect.promise(() =>
              ctx.db.patch("searchLanes", laneId, { workId })
            );
          }),
        { concurrency: 1, discard: true }
      )
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
    country: v.optional(v.string()),
    laneId: v.id("searchLanes"),
    limit: v.number(),
    locale: v.union(v.literal("en"), v.literal("id")),
    market: v.string(),
    pathway: v.optional(pathwayValidator),
    query: v.string(),
    searchId: v.id("searches"),
    userId: v.id("users"),
    workMode: v.optional(workModeValidator),
  },
  returns: discoveryLaneResultValidator,
  handler: async (ctx, args): Promise<DiscoveryRun> => {
    await ctx.runMutation(internal.searches.markLaneRunning, {
      laneId: args.laneId,
      searchId: args.searchId,
      userId: args.userId,
    });
    const intent = SearchIntent.make({
      country: args.country,
      locale: args.locale,
      pathway: args.pathway,
      query: SearchQuery.make(args.query),
      workMode: args.workMode,
    });
    return Effect.runPromise(
      discoverLane(
        ctx,
        intent,
        { limit: args.limit, market: args.market },
        args.userId,
        (opportunity): Promise<boolean> =>
          ctx.runMutation(internal.searches.append, {
            opportunity: storedOpportunity(opportunity),
            searchId: args.searchId,
            userId: args.userId,
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
        .take(100),
      ctx.db
        .query("applications")
        .withIndex("by_user_updatedAt", (index) => index.eq("userId", userId))
        .order("desc")
        .take(100),
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
            country: searchRecord.country,
            pathway: searchRecord.pathway,
            query: searchRecord.query,
            workMode: searchRecord.workMode,
          },
          profile
        ),
      }))
      .sort((left, right) => right.recommendation - left.recommendation);
  },
});
