import {
  getCitiesOfState,
  getCountries,
  getStatesOfCountry,
  type ICity,
  type ICountry,
  type IState,
} from "@countrystatecity/countries-browser";
import { countries as countryCodes } from "country-flag-icons";
import { Effect, Schema } from "effect";

export const ASEAN_COUNTRY_CODES = [
  "BN",
  "KH",
  "ID",
  "LA",
  "MY",
  "MM",
  "PH",
  "SG",
  "TH",
  "TL",
  "VN",
] as const;

const aseanCodes: ReadonlySet<string> = new Set(ASEAN_COUNTRY_CODES);
const countryNames = {
  en: new Intl.DisplayNames(["en"], { type: "region" }),
  id: new Intl.DisplayNames(["id"], { type: "region" }),
} as const;
const labelSorters = {
  en: new Intl.Collator("en"),
  id: new Intl.Collator("id"),
} as const;
const countryCodesByName = {
  en: new Map(
    countryCodes.flatMap((code) => {
      const name = countryNames.en.of(code)?.toLowerCase();
      return name ? [[name, code] as const] : [];
    })
  ),
  id: new Map(
    countryCodes.flatMap((code) => {
      const name = countryNames.id.of(code)?.toLowerCase();
      return name ? [[name, code] as const] : [];
    })
  ),
} as const;

export type CountryOption = Readonly<{
  code: string;
  group: "asean" | "world";
  label: string;
  name: string;
}>;

export type RegionOption = Readonly<{
  code: string;
  label: string;
  name: string;
}>;

export type CityOption = Readonly<{
  id: number;
  label: string;
  name: string;
}>;

export class GeographyError extends Schema.TaggedError<GeographyError>()(
  "GeographyError",
  {
    operation: Schema.Literals(["cities", "countries", "regions"]),
    reason: Schema.String,
  }
) {}

/** Narrows an application locale to the supported geography languages. */
function geographyLocale(locale: string) {
  return locale === "id" ? "id" : "en";
}

/** Produces a stable localized label from an ISO country code. */
function countryLabel(country: ICountry, locale: string) {
  return countryNames[geographyLocale(locale)].of(country.iso2) ?? country.name;
}

/** Resolves a stored country label to its ISO code without a network request. */
export function countryCodeFromName(value: string, locale: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return;
  }
  const requestedLocale = geographyLocale(locale);
  return (
    countryCodesByName[requestedLocale].get(normalized) ??
    countryCodesByName.en.get(normalized)
  );
}

/** Produces the best available localized subdivision label. */
function regionLabel(region: IState, locale: string) {
  return region.translations[locale] ?? region.name;
}

/** Produces the best available localized city label. */
function cityLabel(city: ICity, locale: string) {
  return city.translations[locale] ?? city.name;
}

/** Maps an unknown geography failure into one typed boundary error. */
function geographyError(
  operation: "cities" | "countries" | "regions",
  cause: unknown
) {
  return new GeographyError({
    operation,
    reason:
      cause instanceof Error ? cause.message : "Location data unavailable",
  });
}

/** Loads every country and keeps ASEAN countries in a prominent first group. */
export const loadCountries = Effect.fn("geography.loadCountries")(function* (
  locale: string
) {
  const countries = yield* Effect.tryPromise({
    catch: (cause) => geographyError("countries", cause),
    try: getCountries,
  });
  const collator = labelSorters[geographyLocale(locale)];
  return countries
    .map(
      (country): CountryOption => ({
        code: country.iso2,
        group: aseanCodes.has(country.iso2) ? "asean" : "world",
        label: countryLabel(country, locale),
        name: country.name,
      })
    )
    .sort((left, right) => {
      if (left.group !== right.group) {
        return left.group === "asean" ? -1 : 1;
      }
      return collator.compare(left.label, right.label);
    });
});

/** Loads and localizes every state, province, or region for one country. */
export const loadRegions = Effect.fn("geography.loadRegions")(function* (
  countryCode: string,
  locale: string
) {
  const regions = yield* Effect.tryPromise({
    catch: (cause) => geographyError("regions", cause),
    try: () => getStatesOfCountry(countryCode),
  });
  const collator = labelSorters[geographyLocale(locale)];
  return regions
    .map(
      (region): RegionOption => ({
        code: region.iso2,
        label: regionLabel(region, locale),
        name: region.name,
      })
    )
    .sort((left, right) => collator.compare(left.label, right.label));
});

/** Loads and localizes every city inside one selected state or province. */
export const loadCities = Effect.fn("geography.loadCities")(function* (
  countryCode: string,
  regionCode: string,
  locale: string
) {
  const cities = yield* Effect.tryPromise({
    catch: (cause) => geographyError("cities", cause),
    try: () => getCitiesOfState(countryCode, regionCode),
  });
  const collator = labelSorters[geographyLocale(locale)];
  return cities
    .map(
      (city): CityOption => ({
        id: city.id,
        label: cityLabel(city, locale),
        name: city.name,
      })
    )
    .sort((left, right) => collator.compare(left.label, right.label));
});
