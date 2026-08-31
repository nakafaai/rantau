import { describe, expect, it } from "@effect/vitest";
import {
  makePlaceScope,
  matchesPlaceScope,
  placeLabel,
  placeTerms,
} from "@repo/domain/place";
import { Effect, Exit } from "effect";

describe("place scope", () => {
  it.effect("builds a country, region, and city hierarchy", () =>
    Effect.gen(function* () {
      const place = yield* makePlaceScope({
        city: " München ",
        country: " Germany ",
        countryCode: "de",
        region: " Bavaria ",
        regionCode: "BY",
      });

      expect(place).toEqual({
        city: "München",
        country: "Germany",
        countryCode: "DE",
        level: "city",
        region: "Bavaria",
        regionCode: "BY",
      });
      expect(place ? placeLabel(place) : "").toBe("München, Bavaria, Germany");
    })
  );

  it.effect("accepts a country without a narrower place", () =>
    Effect.gen(function* () {
      const place = yield* makePlaceScope({
        country: "Indonesia",
        countryCode: "ID",
      });

      expect(place).toEqual({
        country: "Indonesia",
        countryCode: "ID",
        level: "country",
      });
      expect(place ? placeLabel(place) : "").toBe("Indonesia");
      expect(place ? placeTerms(place) : []).toEqual(["Indonesia"]);
    })
  );

  it.effect("builds and formats a region hierarchy", () =>
    Effect.gen(function* () {
      const place = yield* makePlaceScope({
        country: "Germany",
        countryCode: "DE",
        region: "Bavaria",
        regionCode: "BY",
      });

      expect(place ? placeLabel(place) : "").toBe("Bavaria, Germany");
      expect(place ? placeTerms(place) : []).toEqual(["Bavaria", "Germany"]);
    })
  );

  it.effect("returns no scope for empty geographic fields", () =>
    Effect.gen(function* () {
      expect(
        yield* makePlaceScope({ country: " ", countryCode: undefined })
      ).toBeUndefined();
    })
  );

  it.effect("rejects a city without its region", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        makePlaceScope({
          city: "Bandung",
          country: "Indonesia",
          countryCode: "ID",
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
    })
  );

  it.effect("rejects incomplete country and region pairs", () =>
    Effect.gen(function* () {
      const missingCountry = yield* Effect.exit(
        makePlaceScope({ countryCode: "ID" })
      );
      const missingRegionCode = yield* Effect.exit(
        makePlaceScope({
          country: "Indonesia",
          countryCode: "ID",
          region: "West Java",
        })
      );
      const missingRegionName = yield* Effect.exit(
        makePlaceScope({
          country: "Indonesia",
          countryCode: "ID",
          regionCode: "JB",
        })
      );

      expect(Exit.isFailure(missingCountry)).toBe(true);
      expect(Exit.isFailure(missingRegionCode)).toBe(true);
      expect(Exit.isFailure(missingRegionName)).toBe(true);
    })
  );

  it.effect("rejects invalid country codes after normalization", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        makePlaceScope({ country: "Indonesia", countryCode: "IDN" })
      );

      expect(Exit.isFailure(exit)).toBe(true);
    })
  );

  it.effect("returns city matching terms from narrowest to broadest", () =>
    Effect.gen(function* () {
      const place = yield* makePlaceScope({
        city: "Bandung",
        country: "Indonesia",
        countryCode: "ID",
        region: "West Java",
        regionCode: "JB",
      });

      expect(place ? placeTerms(place) : []).toEqual([
        "Bandung",
        "West Java",
        "Indonesia",
      ]);
    })
  );

  it.effect(
    "matches the selected geographic hierarchy without requiring redundant fields",
    () =>
      Effect.gen(function* () {
        const city = yield* makePlaceScope({
          city: "München",
          country: "Germany",
          countryCode: "DE",
          region: "Bavaria",
          regionCode: "BY",
        });
        const region = yield* makePlaceScope({
          country: "Indonesia",
          countryCode: "ID",
          region: "Jawa Barat",
          regionCode: "JB",
        });

        expect(
          city &&
            matchesPlaceScope(city, {
              city: "Munchen",
              countryCode: "DE",
              location: "München, Deutschland",
            })
        ).toBe(true);
        expect(
          region &&
            matchesPlaceScope(region, {
              countryCode: "ID",
              location: "Bandung, Jawa Barat, Indonesia",
            })
        ).toBe(true);
      })
  );

  it.effect("rejects a conflicting country or narrow place", () =>
    Effect.gen(function* () {
      const city = yield* makePlaceScope({
        city: "Bandung",
        country: "Indonesia",
        countryCode: "ID",
        region: "Jawa Barat",
        regionCode: "JB",
      });

      expect(
        city &&
          matchesPlaceScope(city, {
            city: "Bandung",
            countryCode: "MY",
            location: "Bandung, Malaysia",
          })
      ).toBe(false);
      expect(
        city &&
          matchesPlaceScope(city, {
            city: "Bogor",
            countryCode: "ID",
            location: "Bogor, Jawa Barat, Indonesia",
          })
      ).toBe(false);
    })
  );

  it.effect(
    "uses textual country evidence when an ISO code is unavailable",
    () =>
      Effect.gen(function* () {
        const country = yield* makePlaceScope({
          country: "Indonesia",
          countryCode: "ID",
        });

        expect(
          country &&
            matchesPlaceScope(country, {
              location: "Bandung, Jawa Barat, Indonesia",
            })
        ).toBe(true);
        expect(
          country &&
            matchesPlaceScope(country, {
              country: "Germany",
              location: "Berlin",
            })
        ).toBe(false);
      })
  );
});
