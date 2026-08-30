import { HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { components, internal } from "@repo/backend/convex/_generated/api";
import type { Doc, Id } from "@repo/backend/convex/_generated/dataModel";
import {
  action,
  internalAction,
  query,
} from "@repo/backend/convex/_generated/server";
import { DISCOVERY_MODEL, discover } from "@repo/backend/convex/lib/discover";
import { requireUserId } from "@repo/backend/convex/lib/guard";
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
type SearchOutcome = { success: true } | { error: unknown; success: false };

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

/** Converts an unknown execution failure into safe user-facing text. */
function errorMessage(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return String(error.message).slice(0, 500);
  }
  return "Opportunity search could not be completed.";
}

/** Starts a durable search session and schedules vendor work in the background. */
export const start = action({
  args: {
    country: v.optional(v.string()),
    locale: v.union(v.literal("en"), v.literal("id")),
    pathway: v.optional(pathwayValidator),
    query: v.string(),
    workMode: v.optional(workModeValidator),
  },
  returns: v.object({
    searchId: v.id("searches"),
  }),
  handler: async (ctx, args): Promise<{ searchId: Id<"searches"> }> => {
    const userId = await requireUserId(ctx);
    const intentOutcome = await Effect.runPromise(
      makeSearchIntent(args).pipe(
        Effect.match({
          onFailure: (error) => ({ error, success: false }) as const,
          onSuccess: (intent) => ({ intent, success: true }) as const,
        })
      )
    );
    if (!intentOutcome.success) {
      throw new ConvexError({
        code: "INVALID_SEARCH",
        message: intentOutcome.error.message,
      });
    }

    await rateLimiter.limit(ctx, "opportunitySearch", {
      key: userId,
      throws: true,
    });

    const searchId: Id<"searches"> = await ctx.runMutation(
      internal.searches.start,
      {
        country: intentOutcome.intent.country,
        locale: intentOutcome.intent.locale,
        pathway: intentOutcome.intent.pathway,
        query: intentOutcome.intent.query,
        userId,
        workMode: intentOutcome.intent.workMode,
      }
    );

    await ctx.scheduler.runAfter(0, internal.opportunities.execute, {
      country: intentOutcome.intent.country,
      locale: intentOutcome.intent.locale,
      pathway: intentOutcome.intent.pathway,
      query: intentOutcome.intent.query,
      searchId,
      userId,
      workMode: intentOutcome.intent.workMode,
    });

    return { searchId };
  },
});

/** Executes one authenticated search session outside the browser request. */
export const execute = internalAction({
  args: {
    country: v.optional(v.string()),
    locale: v.union(v.literal("en"), v.literal("id")),
    pathway: v.optional(pathwayValidator),
    query: v.string(),
    searchId: v.id("searches"),
    userId: v.id("users"),
    workMode: v.optional(workModeValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const intent = SearchIntent.make({
      country: args.country,
      locale: args.locale,
      pathway: args.pathway,
      query: SearchQuery.make(args.query),
      workMode: args.workMode,
    });

    const program: Effect.Effect<SearchOutcome> = Effect.gen(function* () {
      const discovery = yield* discover(ctx, intent, args.userId);
      const opportunities = discovery.opportunities.map(storedOpportunity);

      yield* Effect.tryPromise({
        catch: () =>
          new SearchExecutionError({
            message: "The results could not be saved.",
            stage: "storage",
          }),
        try: (): Promise<null> =>
          ctx.runMutation(internal.searches.complete, {
            inputTokens: discovery.inputTokens,
            model: DISCOVERY_MODEL,
            opportunities,
            outputTokens: discovery.outputTokens,
            searchId: args.searchId,
            threadId: discovery.threadId,
            userId: args.userId,
          }),
      });

      return null;
    }).pipe(
      Effect.match({
        onFailure: (error) => ({ error, success: false }) as const,
        onSuccess: () => ({ success: true }) as const,
      })
    );

    const outcome: SearchOutcome = await Effect.runPromise(program);
    if (!outcome.success) {
      const message = errorMessage(outcome.error);
      await ctx.runMutation(internal.searches.fail, {
        error: message,
        searchId: args.searchId,
        userId: args.userId,
      });
    }

    return null;
  },
});

export const list = query({
  args: { searchId: v.id("searches") },
  returns: v.array(
    v.object({
      hasProfile: v.boolean(),
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

    const [profile, opportunities] = await Promise.all([
      ctx.db
        .query("profiles")
        .withIndex("by_user", (index) => index.eq("userId", userId))
        .unique(),
      ctx.db
        .query("opportunities")
        .withIndex("by_search", (index) => index.eq("searchId", args.searchId))
        .take(100),
    ]);

    return opportunities
      .map((opportunity) => ({
        ...readinessProjection(profile, opportunity),
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
