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
import type { Opportunity } from "@repo/domain/opportunity";
import { SearchExecutionError, type SearchIntent } from "@repo/domain/search";
import { gateway, jsonSchema } from "ai";
import { DateTime, Effect, Schema } from "effect";

export const DISCOVERY_MODEL = "google/gemini-3.7-flash";

const SOURCE_LIMIT = 100;
const SOURCE_BATCH = 10;
const GLOBAL_MARKETS = [
  "Australia",
  "Brazil",
  "Canada",
  "France",
  "Germany",
  "India",
  "Indonesia",
  "Japan",
  "Mexico",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Poland",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
] as const;

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

export type DiscoveryLane = Readonly<{
  limit: number;
  market: string;
}>;

type OpportunityWriter = (opportunity: Opportunity) => Promise<boolean>;

/** Resolves the bounded regional lanes for one validated search intent. */
export function discoveryLanes(intent: SearchIntent): readonly DiscoveryLane[] {
  const markets = intent.country ? [intent.country] : [...GLOBAL_MARKETS];
  const limit = intent.country
    ? SOURCE_LIMIT
    : Math.ceil(SOURCE_LIMIT / markets.length);
  return markets.map((market) => ({ limit, market }));
}

/** Builds a first-party web query for one regional search lane. */
function webQuery(intent: SearchIntent, market: string) {
  const filters = [market, intent.pathway, intent.workMode]
    .filter(Boolean)
    .join(" ");
  return `${intent.query} ${filters} (apply OR careers OR ausbildung OR apprenticeship OR internship) -site:linkedin.com -site:indeed.com -site:glassdoor.com`;
}

/** Builds an evidence-only prompt for one bounded source batch. */
function analysisPrompt(
  intent: SearchIntent,
  sources: readonly DiscoverySource[]
) {
  const evidence = sources
    .map(
      (source, index) =>
        `SOURCE ${index}\nTitle: ${source.title}\nURL: ${source.url}\nContent:\n${source.content}`
    )
    .join("\n\n");
  const language = intent.locale === "id" ? "Bahasa Indonesia" : "English";

  return `User search: ${intent.query}\nCountry: ${intent.country ?? "Worldwide"}\nPathway: ${intent.pathway ?? "Any"}\nWork mode: ${intent.workMode ?? "Any"}\nOutput language: ${language}\n\nReturn every current, distinct, direct opportunity supported by these sources, up to ${SOURCE_BATCH}. Include city, country, and 2-letter ISO countryCode when supported. sourceIndex must identify the exact supplied source. Application steps must be the shortest truthful route. Exclude stale, unclear, duplicate, aggregator-only, or non-application pages.\n\n${evidence}`;
}

/** Splits source evidence into bounded Agent context batches. */
function batches(sources: readonly DiscoverySource[]) {
  return Array.from(
    { length: Math.ceil(sources.length / SOURCE_BATCH) },
    (_, index) =>
      sources.slice(index * SOURCE_BATCH, (index + 1) * SOURCE_BATCH)
  );
}

/** Searches one market and decodes only readable source evidence. */
function searchMarket(
  ctx: ActionCtx,
  intent: SearchIntent,
  market: string,
  limit: number
) {
  return Effect.tryPromise({
    catch: () =>
      new SearchExecutionError({
        message: "The web search provider is unavailable.",
        stage: "search",
      }),
    try: () =>
      firecrawl.search(ctx, webQuery(intent, market), {
        excludeDomains: ["linkedin.com", "indeed.com", "glassdoor.com"],
        limit,
        location: market,
        scrapeOptions: {
          formats: ["markdown"],
          maxAge: 3_600_000,
          onlyMainContent: true,
        },
        sources: ["web"],
      }),
  }).pipe(Effect.flatMap(decodeDiscoverySources));
}

/** Analyzes one evidence batch with an isolated Convex Agent thread. */
function analyzeBatch(
  ctx: ActionCtx,
  intent: SearchIntent,
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
          prompt: analysisPrompt(intent, sources),
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
    return {
      inputTokens: generated.usage.inputTokens ?? 0,
      opportunities,
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
    { concurrency: 1 }
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
  const sources = yield* searchMarket(ctx, intent, lane.market, lane.limit);
  if (sources.length === 0) {
    return yield* Effect.fail(
      new SearchExecutionError({
        message: `No readable opportunity pages were found in ${lane.market}.`,
        stage: "search",
      })
    );
  }
  const analyzed = yield* Effect.forEach(
    batches(sources),
    (sourceBatch) =>
      analyzeBatch(ctx, intent, sourceBatch, userId, now).pipe(Effect.result),
    { concurrency: 3 }
  );
  const completed = analyzed.flatMap((result) =>
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
  const resultCount = yield* persistOpportunities(
    completed.flatMap((result) => result.opportunities),
    writeOpportunity
  );

  return {
    inputTokens: completed.reduce(
      (total, result) => total + result.inputTokens,
      0
    ),
    outputTokens: completed.reduce(
      (total, result) => total + result.outputTokens,
      0
    ),
    resultCount,
    threadId: completed.map((result) => result.threadId).join(","),
  } satisfies DiscoveryRun;
});
