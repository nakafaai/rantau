import { Effect, String as EffectString, pipe, Schema } from "effect";

const PLACE_NAME_LIMIT = 120;

export const CountryCode = Schema.String.check(Schema.isPattern(/^[A-Z]{2}$/u));

export const PlaceName = Schema.String.check(
  Schema.isLengthBetween(1, PLACE_NAME_LIMIT)
);

export const CountryPlace = Schema.Struct({
  country: PlaceName,
  countryCode: CountryCode,
  level: Schema.Literal("country"),
});

export const RegionPlace = Schema.Struct({
  country: PlaceName,
  countryCode: CountryCode,
  level: Schema.Literal("region"),
  region: PlaceName,
  regionCode: PlaceName,
});

export const CityPlace = Schema.Struct({
  city: PlaceName,
  country: PlaceName,
  countryCode: CountryCode,
  level: Schema.Literal("city"),
  region: PlaceName,
  regionCode: PlaceName,
});

export const PlaceScope = Schema.Union([CountryPlace, RegionPlace, CityPlace]);
export type PlaceScope = Schema.Schema.Type<typeof PlaceScope>;

export class PlaceScopeError extends Schema.TaggedError<PlaceScopeError>()(
  "PlaceScopeError",
  { message: Schema.String }
) {}

type PlaceScopeInput = Readonly<{
  city?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionCode?: string;
}>;

type LocatedOpportunity = Readonly<{
  city?: string;
  country?: string;
  countryCode?: string;
  location: string;
  region?: string;
}>;

/** Normalizes one optional geographic label without inventing a value. */
function optionalLabel(value: string | undefined) {
  const normalized = pipe(value ?? "", EffectString.trim);
  return normalized || undefined;
}

/** Creates one valid hierarchical place from form or storage fields. */
export const makePlaceScope = Effect.fn("place.makeScope")(function* (
  input: PlaceScopeInput
) {
  const city = optionalLabel(input.city);
  const country = optionalLabel(input.country);
  const countryCode = optionalLabel(input.countryCode)?.toUpperCase();
  const region = optionalLabel(input.region);
  const regionCode = optionalLabel(input.regionCode);

  if (!(country || countryCode || region || regionCode || city)) {
    return;
  }
  if (!(country && countryCode)) {
    return yield* Effect.fail(
      new PlaceScopeError({ message: "A place requires a country and code." })
    );
  }
  if (city && !(region && regionCode)) {
    return yield* Effect.fail(
      new PlaceScopeError({ message: "A city requires its region." })
    );
  }
  if (Boolean(region) !== Boolean(regionCode)) {
    return yield* Effect.fail(
      new PlaceScopeError({
        message: "A region requires its name and code.",
      })
    );
  }

  let candidate: unknown = { country, countryCode, level: "country" };
  if (region && regionCode) {
    candidate = { country, countryCode, level: "region", region, regionCode };
  }
  if (city) {
    candidate = {
      city,
      country,
      countryCode,
      level: "city",
      region,
      regionCode,
    };
  }

  return yield* Schema.decodeUnknownEffect(PlaceScope)(candidate).pipe(
    Effect.mapError(
      () => new PlaceScopeError({ message: "The selected place is invalid." })
    )
  );
});

/** Formats the narrowest selected place without losing its hierarchy. */
export function placeLabel(place: PlaceScope) {
  if (place.level === "city") {
    return `${place.city}, ${place.region}, ${place.country}`;
  }
  if (place.level === "region") {
    return `${place.region}, ${place.country}`;
  }
  return place.country;
}

/** Returns geographic terms from narrowest to broadest for matching. */
export function placeTerms(place: PlaceScope) {
  if (place.level === "city") {
    return [place.city, place.region, place.country];
  }
  if (place.level === "region") {
    return [place.region, place.country];
  }
  return [place.country];
}

/** Normalizes one geographic label for accent-insensitive evidence matching. */
function matchLabel(value: string) {
  return pipe(
    value,
    EffectString.normalize("NFKD"),
    EffectString.replace(/\p{M}/gu, ""),
    EffectString.toLowerCase,
    EffectString.replace(/[^\p{L}\p{N}]+/gu, " "),
    EffectString.trim
  );
}

/** Checks generated location evidence against the user's narrowest place. */
export function matchesPlaceScope(
  place: PlaceScope,
  opportunity: LocatedOpportunity
) {
  const countryCode = opportunity.countryCode?.toUpperCase();
  if (countryCode && countryCode !== place.countryCode) {
    return false;
  }

  const countryEvidence = matchLabel(
    [opportunity.country, opportunity.location].filter(Boolean).join(" ")
  );
  if (!(countryCode || countryEvidence.includes(matchLabel(place.country)))) {
    return false;
  }

  if (place.level === "country") {
    return true;
  }
  const regionEvidence = matchLabel(
    [opportunity.region, opportunity.location].filter(Boolean).join(" ")
  );
  if (place.level === "region") {
    return regionEvidence.includes(matchLabel(place.region));
  }

  const cityEvidence = matchLabel(
    [opportunity.city, opportunity.location].filter(Boolean).join(" ")
  );
  return cityEvidence.includes(matchLabel(place.city));
}
