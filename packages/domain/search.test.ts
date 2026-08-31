import { describe, expect, it } from "@effect/vitest";
import { makeSearchIntent } from "@repo/domain/search";
import { Effect, Exit } from "effect";

describe("makeSearchIntent", () => {
  it.effect("normalizes useful queries", () =>
    Effect.gen(function* () {
      const intent = yield* makeSearchIntent({
        locale: "id",
        pathway: "job",
        place: {
          country: "Japan",
          countryCode: "JP",
          level: "country",
        },
        query: "  kerja   perawat di Jepang  ",
        workMode: "onsite",
      });
      expect(intent).toEqual({
        locale: "id",
        pathway: "job",
        place: {
          country: "Japan",
          countryCode: "JP",
          level: "country",
        },
        query: "kerja perawat di Jepang",
        workMode: "onsite",
      });
    })
  );

  it.effect("accepts structured filters without a free-form query", () =>
    Effect.gen(function* () {
      const intent = yield* makeSearchIntent({
        locale: "en",
        pathway: "ausbildung",
        place: {
          country: "Germany",
          countryCode: "DE",
          level: "country",
        },
        query: "",
      });
      expect(intent).toEqual({
        locale: "en",
        pathway: "ausbildung",
        place: {
          country: "Germany",
          countryCode: "DE",
          level: "country",
        },
        query: "work opportunities",
        workMode: undefined,
      });
    })
  );

  it.effect("rejects empty queries", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        makeSearchIntent({ locale: "en", query: "  " })
      );
      expect(Exit.isFailure(exit)).toBe(true);
    })
  );

  it.effect("rejects oversized queries", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        makeSearchIntent({ locale: "en", query: "x".repeat(401) })
      );
      expect(Exit.isFailure(exit)).toBe(true);
    })
  );
});
