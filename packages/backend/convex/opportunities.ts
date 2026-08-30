import { Agent } from "@convex-dev/agent";
import { HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { components, internal } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { action, query } from "@repo/backend/convex/_generated/server";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import { readinessStepValidator } from "@repo/backend/convex/model";
import schema from "@repo/backend/convex/schema";
import {
  bindOpportunities,
  type DiscoverySource,
  decodeDiscoverySources,
  ExtractionResult,
} from "@repo/domain/discovery";
import type { Opportunity } from "@repo/domain/opportunity";
import { buildReadinessPlan, readinessPercent } from "@repo/domain/readiness";
import { makeSearchIntent, SearchExecutionError } from "@repo/domain/search";
import { gateway } from "ai";
import { ConvexError, v } from "convex/values";
import { Effect, Schema } from "effect";

const MODEL = "openai/gpt-5.4-mini";

const firecrawl = new FirecrawlClient(components.firecrawl);
const rateLimiter = new RateLimiter(components.rateLimiter, {
  opportunitySearch: {
    capacity: 6,
    kind: "token bucket",
    period: HOUR,
    rate: 6,
  },
});
const analyst = new Agent(components.agent, {
  instructions:
    "You analyze job and vocational opportunity pages for Rantau. Extract only claims supported by the supplied sources. Never invent a link, requirement, salary, deadline, support organization, or application step. Prefer direct employer, government, school, or program application pages. Write concise plain language in the requested locale.",
  languageModel: gateway(MODEL),
  name: "Rantau opportunity analyst",
});

const extractionSchema = Schema.toStandardSchemaV1(ExtractionResult);

type SearchOutcome =
  | { count: number; success: true }
  | { error: unknown; success: false };

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

/** Builds a web query biased toward first-party application pages. */
function buildWebQuery(searchText: string) {
  return `${searchText} (apply OR careers OR ausbildung OR apprenticeship) -site:linkedin.com -site:indeed.com -site:glassdoor.com`;
}

/** Builds the evidence-only extraction prompt for the Convex Agent component. */
function buildAnalysisPrompt(
  searchText: string,
  locale: "en" | "id",
  sources: readonly DiscoverySource[]
) {
  const evidence = sources
    .map(
      (source, index) =>
        `SOURCE ${index}\nTitle: ${source.title}\nURL: ${source.url}\nContent:\n${source.content}`
    )
    .join("\n\n");
  const language = locale === "id" ? "Bahasa Indonesia" : "English";

  return `User search: ${searchText}\nOutput language: ${language}\n\nReturn at most 10 current opportunities. sourceIndex must point to the exact supplied source used for that item. The applicationSteps must explain the shortest truthful route to apply. Requirements and support resources must be explicitly supported by the source. If a support resource URL is absent in evidence, use null. Exclude stale, unclear, duplicate, aggregator-only, or non-application pages.\n\n${evidence}`;
}

/** Converts an unknown execution failure into safe user-facing text. */
function errorMessage(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return String(error.message).slice(0, 500);
  }
  return "Opportunity search could not be completed.";
}

export const search = action({
  args: {
    locale: v.union(v.literal("en"), v.literal("id")),
    query: v.string(),
  },
  returns: v.object({
    count: v.number(),
    searchId: v.id("searches"),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ count: number; searchId: Id<"searches"> }> => {
    const userId = await requireUserId(ctx);
    await rateLimiter.limit(ctx, "opportunitySearch", {
      key: userId,
      throws: true,
    });

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

    const searchId: Id<"searches"> = await ctx.runMutation(
      internal.searches.start,
      {
        locale: intentOutcome.intent.locale,
        query: intentOutcome.intent.query,
        userId,
      }
    );

    const program: Effect.Effect<SearchOutcome> = Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        catch: () =>
          new SearchExecutionError({
            message: "The web search provider is unavailable.",
            stage: "search",
          }),
        try: () =>
          firecrawl.search(ctx, buildWebQuery(intentOutcome.intent.query), {
            excludeDomains: ["linkedin.com", "indeed.com", "glassdoor.com"],
            limit: 10,
            scrapeOptions: {
              formats: ["markdown"],
              maxAge: 3_600_000,
              onlyMainContent: true,
            },
            sources: ["web"],
          }),
      });
      const sources = yield* decodeDiscoverySources(response);
      if (sources.length === 0) {
        return yield* Effect.fail(
          new SearchExecutionError({
            message: "No readable first-party opportunity pages were found.",
            stage: "search",
          })
        );
      }

      const thread = yield* Effect.tryPromise({
        catch: () =>
          new SearchExecutionError({
            message: "The opportunity analyst is unavailable.",
            stage: "analysis",
          }),
        try: () =>
          analyst.createThread(ctx, {
            title: intentOutcome.intent.query,
            userId,
          }),
      });
      const generated = yield* Effect.tryPromise({
        catch: () =>
          new SearchExecutionError({
            message: "The opportunity pages could not be analyzed.",
            stage: "analysis",
          }),
        try: () =>
          thread.thread.generateObject({
            prompt: buildAnalysisPrompt(
              intentOutcome.intent.query,
              intentOutcome.intent.locale,
              sources
            ),
            providerOptions: {
              gateway: {
                models: ["google/gemini-3.5-flash-lite"],
                tags: ["feature:opportunity-search"],
                user: userId,
              },
            },
            schema: extractionSchema,
          }),
      });
      const bound = yield* bindOpportunities(
        generated.object,
        sources,
        new Date().toISOString()
      );
      const opportunities = bound.map(storedOpportunity);

      yield* Effect.tryPromise({
        catch: () =>
          new SearchExecutionError({
            message: "The results could not be saved.",
            stage: "storage",
          }),
        try: (): Promise<null> =>
          ctx.runMutation(internal.searches.complete, {
            inputTokens: generated.usage.inputTokens,
            model: MODEL,
            opportunities,
            outputTokens: generated.usage.outputTokens,
            searchId,
            threadId: thread.threadId,
            userId,
          }),
      });

      return opportunities.length;
    }).pipe(
      Effect.match({
        onFailure: (error) => ({ error, success: false }) as const,
        onSuccess: (count) => ({ count, success: true }) as const,
      })
    );

    const outcome: SearchOutcome = await Effect.runPromise(program);
    if (!outcome.success) {
      const message = errorMessage(outcome.error);
      await ctx.runMutation(internal.searches.fail, {
        error: message,
        searchId,
      });
      throw new ConvexError({ code: "SEARCH_FAILED", message });
    }

    return { count: outcome.count, searchId };
  },
});

export const list = query({
  args: { searchId: v.id("searches") },
  returns: v.array(schema.doc("opportunities")),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const searchRecord = await ctx.db.get("searches", args.searchId);
    if (!searchRecord || searchRecord.userId !== userId) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }

    return ctx.db
      .query("opportunities")
      .withIndex("by_search", (index) => index.eq("searchId", args.searchId))
      .take(20);
  },
});

export const detail = query({
  args: { opportunityId: v.id("opportunities") },
  returns: v.object({
    opportunity: schema.doc("opportunities"),
    readiness: v.array(readinessStepValidator),
    readinessPercent: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const opportunity = await ctx.db.get("opportunities", args.opportunityId);
    if (!opportunity || opportunity.userId !== userId) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (index) => index.eq("userId", userId))
      .unique();
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
      opportunity,
      readiness,
      readinessPercent: readinessPercent(readiness),
    };
  },
});
