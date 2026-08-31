import { OpportunityPathway, WorkMode } from "@repo/domain/opportunity";
import { PlaceScope } from "@repo/domain/place";
import { Effect, Schema } from "effect";

const MAX_QUERY_LENGTH = 400;

export const SearchLocale = Schema.Literals(["en", "id"]);

export const SearchQuery = Schema.String.pipe(
  Schema.brand("@Rantau/SearchQuery")
);
export type SearchQuery = Schema.Schema.Type<typeof SearchQuery>;

export const SearchIntent = Schema.Struct({
  locale: SearchLocale,
  pathway: Schema.optional(OpportunityPathway),
  place: Schema.optional(PlaceScope),
  query: SearchQuery,
  workMode: Schema.optional(WorkMode),
});
export type SearchIntent = Schema.Schema.Type<typeof SearchIntent>;

export class SearchIntentError extends Schema.TaggedError<SearchIntentError>()(
  "SearchIntentError",
  {
    message: Schema.String,
  }
) {}

export class SearchExecutionError extends Schema.TaggedError<SearchExecutionError>()(
  "SearchExecutionError",
  {
    limitation: Schema.optional(
      Schema.Literals(["deadline", "source_capacity", "source_exhausted"])
    ),
    message: Schema.String,
    stage: Schema.Literals(["search", "analysis", "storage"]),
  }
) {}

/** Normalizes and validates a candidate's free-form opportunity search. */
export const makeSearchIntent = Effect.fn("search.makeIntent")(
  function* (input: {
    locale: "en" | "id";
    pathway?:
      | "apprenticeship"
      | "ausbildung"
      | "internship"
      | "job"
      | "vocational";
    query: string;
    place?: Schema.Schema.Type<typeof PlaceScope>;
    workMode?: "hybrid" | "onsite" | "remote";
  }) {
    const query = input.query.trim().replaceAll(/\s+/g, " ");
    if (
      query.length === 0 &&
      !(input.place || input.pathway || input.workMode)
    ) {
      return yield* Effect.fail(
        new SearchIntentError({
          message: "Add a query or choose at least one filter.",
        })
      );
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return yield* Effect.fail(
        new SearchIntentError({
          message: `Keep the search under ${MAX_QUERY_LENGTH} characters.`,
        })
      );
    }

    return {
      locale: input.locale,
      pathway: input.pathway,
      place: input.place,
      query: SearchQuery.make(query || "work opportunities"),
      workMode: input.workMode,
    };
  }
);
