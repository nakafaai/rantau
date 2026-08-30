import { Effect, Schema } from "effect";

const MAX_QUERY_LENGTH = 400;

export const SearchLocale = Schema.Literals(["en", "id"]);

export const SearchQuery = Schema.String.pipe(
  Schema.brand("@Rantau/SearchQuery")
);
export type SearchQuery = Schema.Schema.Type<typeof SearchQuery>;

export const SearchIntent = Schema.Struct({
  locale: SearchLocale,
  query: SearchQuery,
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
    message: Schema.String,
    stage: Schema.Literals(["search", "analysis", "storage"]),
  }
) {}

/** Normalizes and validates a candidate's free-form opportunity search. */
export const makeSearchIntent = Effect.fn("search.makeIntent")(
  function* (input: { locale: "en" | "id"; query: string }) {
    const query = input.query.trim().replaceAll(/\s+/g, " ");

    if (query.length === 0) {
      return yield* Effect.fail(
        new SearchIntentError({
          message: "Describe the work you want to find.",
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

    return { locale: input.locale, query: SearchQuery.make(query) };
  }
);
