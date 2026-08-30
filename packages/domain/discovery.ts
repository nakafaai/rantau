import {
  HttpUrl,
  type Opportunity,
  OpportunityPathway,
  OpportunityRequirement,
  SourceKind,
  SupportResource,
  WorkMode,
} from "@repo/domain/opportunity";
import { Effect, Schema } from "effect";

const MAX_SOURCE_CONTENT = 12_000;

const SearchResult = Schema.Struct({
  description: Schema.optional(Schema.String),
  markdown: Schema.optional(Schema.String),
  metadata: Schema.optional(
    Schema.Struct({
      sourceURL: Schema.optional(Schema.String),
      title: Schema.optional(Schema.String),
      url: Schema.optional(Schema.String),
    })
  ),
  title: Schema.optional(Schema.String),
  url: Schema.optional(Schema.String),
});

const SearchResponse = Schema.Struct({
  web: Schema.optional(Schema.Array(SearchResult)),
});

export const DiscoverySource = Schema.Struct({
  content: Schema.String,
  title: Schema.String,
  url: HttpUrl,
});
export type DiscoverySource = Schema.Schema.Type<typeof DiscoverySource>;

export const ExtractedOpportunity = Schema.Struct({
  applicationSteps: Schema.Array(Schema.String).check(
    Schema.isLengthBetween(1, 8)
  ),
  company: Schema.String,
  deadline: Schema.NullOr(Schema.String),
  employmentType: Schema.String,
  location: Schema.String,
  pathway: OpportunityPathway,
  publishedAt: Schema.NullOr(Schema.String),
  requirements: Schema.Array(OpportunityRequirement).check(
    Schema.isLengthBetween(0, 12)
  ),
  salary: Schema.NullOr(Schema.String),
  sourceIndex: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  sourceKind: SourceKind,
  sourceName: Schema.String,
  summary: Schema.String,
  support: Schema.Array(SupportResource).check(Schema.isLengthBetween(0, 8)),
  title: Schema.String,
  workMode: WorkMode,
});

export const ExtractionResult = Schema.Struct({
  opportunities: Schema.Array(ExtractedOpportunity).check(
    Schema.isLengthBetween(0, 12)
  ),
});
export type ExtractionResult = Schema.Schema.Type<typeof ExtractionResult>;

export class DiscoveryError extends Schema.TaggedError<DiscoveryError>()(
  "DiscoveryError",
  {
    message: Schema.String,
  }
) {}

/** Converts Firecrawl's untrusted response into bounded source evidence. */
export const decodeDiscoverySources = Effect.fn("discovery.decodeSources")(
  function* (input: unknown) {
    const response = yield* Schema.decodeUnknownEffect(SearchResponse)(
      input
    ).pipe(
      Effect.mapError(
        () =>
          new DiscoveryError({
            message: "The search provider returned an unreadable response.",
          })
      )
    );

    return yield* Effect.forEach(response.web ?? [], (result) => {
      const url =
        result.url ?? result.metadata?.sourceURL ?? result.metadata?.url;
      if (!url) {
        return Effect.succeed<readonly DiscoverySource[]>([]);
      }

      const title = result.title ?? result.metadata?.title ?? url;
      const content = (result.markdown ?? result.description ?? "").slice(
        0,
        MAX_SOURCE_CONTENT
      );
      return Schema.decodeUnknownEffect(DiscoverySource)({
        content,
        title,
        url,
      }).pipe(
        Effect.match({
          onFailure: () => [] as const,
          onSuccess: (source) => [source] as const,
        })
      );
    }).pipe(Effect.map((sources) => sources.flat()));
  }
);

/** Pins generated opportunity details to a verified Firecrawl source URL. */
export const bindOpportunities = Effect.fn("discovery.bindOpportunities")(
  function* (
    extraction: ExtractionResult,
    sources: readonly DiscoverySource[],
    retrievedAt: string
  ) {
    const opportunities: Opportunity[] = [];

    for (const candidate of extraction.opportunities) {
      const source = sources[candidate.sourceIndex];
      if (!source) {
        continue;
      }

      opportunities.push({
        applicationSteps: candidate.applicationSteps,
        company: candidate.company,
        deadline: candidate.deadline,
        directApplyUrl: source.url,
        employmentType: candidate.employmentType,
        location: candidate.location,
        pathway: candidate.pathway,
        publishedAt: candidate.publishedAt,
        requirements: candidate.requirements,
        salary: candidate.salary,
        source: {
          kind: candidate.sourceKind,
          name: candidate.sourceName || source.title,
          retrievedAt,
          url: source.url,
        },
        summary: candidate.summary,
        support: candidate.support,
        title: candidate.title,
        workMode: candidate.workMode,
      });
    }

    if (opportunities.length === 0) {
      return yield* Effect.fail(
        new DiscoveryError({
          message: "No source-backed opportunities were found for this search.",
        })
      );
    }

    return opportunities;
  }
);
