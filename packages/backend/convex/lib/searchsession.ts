import type { Doc } from "@repo/backend/convex/_generated/dataModel";
import type { PlaceScope } from "@repo/domain/place";
import { SearchIntent, SearchQuery } from "@repo/domain/search";

type StoredSearchPlace = Pick<
  Doc<"searches">,
  "city" | "country" | "countryCode" | "region" | "regionCode"
>;

/** Restores a typed place from the flattened Convex search document. */
export function searchPlace(search: StoredSearchPlace): PlaceScope | undefined {
  if (!(search.country && search.countryCode)) {
    return undefined;
  }
  if (search.city && search.region && search.regionCode) {
    return {
      city: search.city,
      country: search.country,
      countryCode: search.countryCode,
      level: "city",
      region: search.region,
      regionCode: search.regionCode,
    };
  }
  if (search.region && search.regionCode) {
    return {
      country: search.country,
      countryCode: search.countryCode,
      level: "region",
      region: search.region,
      regionCode: search.regionCode,
    };
  }
  return {
    country: search.country,
    countryCode: search.countryCode,
    level: "country",
  };
}

/** Restores one immutable domain intent from its durable search document. */
export function searchIntent(search: Doc<"searches">) {
  return SearchIntent.make({
    locale: search.locale,
    pathway: search.pathway,
    place: searchPlace(search),
    query: SearchQuery.make(search.query),
    workMode: search.workMode,
  });
}
