import { Agent } from "@convex-dev/agent";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { components } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import type { ActionCtx } from "@repo/backend/convex/_generated/server";
import {
  bindOpportunities,
  type DiscoverySource,
  decodeDiscoverySources,
  ExtractionResult,
} from "@repo/domain/discovery";
import type { DiscoveryLane } from "@repo/domain/discoveryplan";
import type { Opportunity } from "@repo/domain/opportunity";
import { matchesPlaceScope, placeLabel } from "@repo/domain/place";
import { SearchExecutionError, type SearchIntent } from "@repo/domain/search";
import { gateway, jsonSchema } from "ai";
import {
  DateTime,
  Effect,
  Array as EffectArray,
  Schedule,
  Schema,
} from "effect";

export const DISCOVERY_MODEL = "google/gemini-3.7-flash";

const SOURCE_BATCH = 6;
const FIRST_SOURCE_BATCH = 3;
const SEARCH_TIMEOUT_MS = 45_000;
const SCRAPE_TIMEOUT_MS = 20_000;
const SOURCE_CAPACITY_PATTERN =
  /(?:Insufficient credits|Rate limit exceeded|"status":40[29])/u;
const ANALYSIS_RETRY_POLICY = {
  schedule: Schedule.exponential("1 second").pipe(Schedule.jittered),
  times: 1,
} as const;

const firecrawl = new FirecrawlClient(components.firecrawl);
const analyst = new Agent(components.agent, {
  instructions:
    "You analyze job and vocational opportunity pages for Rantau. Extract only claims supported by the supplied sources. Never invent a link, requirement, salary, deadline, support organization, or application step. Prefer direct employer, government, school, or program application pages. Write concise plain language in the requested locale.",
  languageModel: gateway(DISCOVERY_MODEL),
  name: "Rantau opportunity analyst",
});
const extractionSchema = jsonSchema<ExtractionResult>(
  Schema.toJsonSchemaDocument(ExtractionResult).schema
);

export type DiscoveryRun = Readonly<{
  inputTokens: number;
  outputTokens: number;
  resultCount: number;
  threadId: string;
}>;

type OpportunityWriter = (opportunity: Opportunity) => Promise<boolean>;

/** Serializes provider failures without discarding structured Convex details. */
function errorDescription(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  try {
    const serialized = JSON.stringify(error);
    return serialized && serialized !== "{}"
      ? `${message} ${serialized}`.slice(0, 500)
      : message.slice(0, 500);
  } catch {
    return message.slice(0, 500);
  }
}

/** Classifies a Firecrawl quota boundary that should stop adaptive expansion. */
function sourceLimitation(description: string) {
  return SOURCE_CAPACITY_PATTERN.test(description)
    ? ("source_capacity" as const)
    : undefined;
}

/** Builds an evidence-only prompt for one bounded source batch. */
function analysisPrompt(
  intent: SearchIntent,
  market: string,
  sources: readonly DiscoverySource[]
) {
  const evidence = sources
    .map(
      (source, index) =>
        `SOURCE ${index}\nTitle: ${source.title}\nURL: ${source.url}\nContent:\n${source.content}`
    )
    .join("\n\n");
  const language = intent.locale === "id" ? "Bahasa Indonesia" : "English";

  return `User search: ${intent.query}\nSearch market: ${market}\nPlace filter: ${intent.place ? placeLabel(intent.place) : "Worldwide"}\nPathway: ${intent.pathway ?? "Any"}\nWork mode: ${intent.workMode ?? "Any"}\nOutput language: ${language}\n\nReturn every current, distinct opportunity supported by these sources, up to ${SOURCE_BATCH}. A valid opportunity has a specific role or program and a usable application route. It must satisfy the selected city, region, and country when a Place filter is present. Prefer employer, government, school, or program pages, but include a trustworthy marketplace listing when it represents a real current opening. Include city, administrative region, country, and 2-letter ISO countryCode when supported. sourceIndex must identify the exact supplied source. Application steps must be the shortest truthful route. Exclude stale, unclear, duplicate, course-advertising, article, and search-result-list pages.\n\n${evidence}`;
}

/** Splits source evidence into bounded Agent context batches. */
function batches(sources: readonly DiscoverySource[]) {
  if (sources.length <= SOURCE_BATCH) {
    return [sources];
  }
  const first = sources.slice(0, FIRST_SOURCE_BATCH);
  const remaining = sources.slice(FIRST_SOURCE_BATCH);
  return [first, ...EffectArray.chunksOf(remaining, SOURCE_BATCH)];
}

/** Searches one market and decodes only readable source evidence. */
function searchMarket(ctx: ActionCtx, lane: DiscoveryLane) {
  return Effect.tryPromise({
    catch: (error) => {
      const description = errorDescription(error);
      return new SearchExecutionError({
        limitation: sourceLimitation(description),
        message: `Web search provider failure: ${description}`.slice(0, 500),
        stage: "search",
      });
    },
    try: () =>
      firecrawl.search(ctx, lane.sourceQuery, {
        excludeDomains: ["linkedin.com", "indeed.com", "glassdoor.com"],
        limit: lane.limit,
        location: lane.market,
        scrapeOptions: {
          formats: ["markdown"],
          maxAge: 3_600_000,
          onlyMainContent: true,
          timeout: SCRAPE_TIMEOUT_MS,
        },
        sources: ["web"],
        timeout: SEARCH_TIMEOUT_MS,
      }),
  }).pipe(Effect.flatMap(decodeDiscoverySources));
}

/** Analyzes one evidence batch with an isolated Convex Agent thread. */
function analyzeBatch(
  ctx: ActionCtx,
  intent: SearchIntent,
  market: string,
  sources: readonly DiscoverySource[],
  userId: Id<"users">,
  retrievedAt: string
) {
  return Effect.gen(function* () {
    const thread = yield* Effect.tryPromise({
      catch: () =>
        new SearchExecutionError({
          message: "The opportunity analyst is unavailable.",
          stage: "analysis",
        }),
      try: () => analyst.createThread(ctx, { title: intent.query, userId }),
    });
    const generated = yield* Effect.tryPromise({
      catch: () =>
        new SearchExecutionError({
          message: "The opportunity pages could not be analyzed.",
          stage: "analysis",
        }),
      try: () =>
        thread.thread.generateObject({
          prompt: analysisPrompt(intent, market, sources),
          providerOptions: {
            gateway: {
              tags: ["feature:opportunity-search"],
              user: userId,
            },
          },
          schema: extractionSchema,
        }),
    });
    const extraction = yield* Schema.decodeUnknownEffect(ExtractionResult)(
      generated.object
    ).pipe(
      Effect.mapError(
        () =>
          new SearchExecutionError({
            message: "The opportunity analyst returned invalid data.",
            stage: "analysis",
          })
      )
    );
    const opportunities = yield* bindOpportunities(
      extraction,
      sources,
      retrievedAt
    );
    const { place } = intent;
    const matchingOpportunities = place
      ? opportunities.filter((opportunity) =>
          matchesPlaceScope(place, opportunity)
        )
      : opportunities;
    return {
      inputTokens: generated.usage.inputTokens ?? 0,
      opportunities: matchingOpportunities,
      outputTokens: generated.usage.outputTokens ?? 0,
      threadId: thread.threadId,
    };
  });
}

/** Persists analyzed opportunities as independent realtime updates. */
function persistOpportunities(
  opportunities: readonly Opportunity[],
  writeOpportunity: OpportunityWriter
) {
  return Effect.forEach(
    opportunities,
    (opportunity) =>
      Effect.tryPromise({
        catch: () =>
          new SearchExecutionError({
            message: "A search result could not be saved.",
            stage: "storage",
          }),
        try: () => writeOpportunity(opportunity),
      }),
    { concurrency: 2 }
  ).pipe(Effect.map((persisted) => persisted.filter(Boolean).length));
}

/** Runs one durable, source-backed regional discovery lane. */
export const discoverLane = Effect.fn("opportunities.discoverLane")(function* (
  ctx: ActionCtx,
  intent: SearchIntent,
  lane: DiscoveryLane,
  userId: Id<"users">,
  writeOpportunity: OpportunityWriter
) {
  const now = DateTime.formatIso(yield* DateTime.now);
  const sources = yield* searchMarket(ctx, lane);
  if (sources.length === 0) {
    return yield* Effect.fail(
      new SearchExecutionError({
        limitation: "source_exhausted",
        message: `No readable opportunity pages were found in ${lane.market}.`,
        stage: "search",
      })
    );
  }
  const analyzedAndPersisted = yield* Effect.forEach(
    batches(sources),
    (sourceBatch) =>
      analyzeBatch(ctx, intent, lane.market, sourceBatch, userId, now).pipe(
        Effect.retry(ANALYSIS_RETRY_POLICY),
        Effect.flatMap((analysis) =>
          persistOpportunities(analysis.opportunities, writeOpportunity).pipe(
            Effect.map((resultCount) => ({ ...analysis, resultCount }))
          )
        ),
        Effect.result
      ),
    { concurrency: 2 }
  );
  const completed = analyzedAndPersisted.flatMap((result) =>
    result._tag === "Success" ? [result.success] : []
  );
  if (completed.length === 0) {
    return yield* Effect.fail(
      new SearchExecutionError({
        message: `Opportunity pages in ${lane.market} could not be analyzed.`,
        stage: "analysis",
      })
    );
  }
  return {
    inputTokens: completed.reduce(
      (total, result) => total + result.inputTokens,
      0
    ),
    outputTokens: completed.reduce(
      (total, result) => total + result.outputTokens,
      0
    ),
    resultCount: completed.reduce(
      (total, result) => total + result.resultCount,
      0
    ),
    threadId: completed.map((result) => result.threadId).join(","),
  } satisfies DiscoveryRun;
});
