import { describe, expect, it } from "@effect/vitest";
import { makeSearchIntent } from "@repo/domain/search";
import { Effect, Exit } from "effect";

describe("makeSearchIntent", () => {
  it.effect("normalizes useful queries", () =>
    Effect.gen(function* () {
      const intent = yield* makeSearchIntent({
        country: "Japan",
        locale: "id",
        pathway: "job",
        query: "  kerja   perawat di Jepang  ",
        workMode: "onsite",
      });
      expect(intent).toEqual({
        country: "Japan",
        locale: "id",
        pathway: "job",
        query: "kerja perawat di Jepang",
        workMode: "onsite",
      });
    })
  );

  it.effect("accepts structured filters without a free-form query", () =>
    Effect.gen(function* () {
      const intent = yield* makeSearchIntent({
        country: "Germany",
        locale: "en",
        pathway: "ausbildung",
        query: "",
      });
      expect(intent).toEqual({
        country: "Germany",
        locale: "en",
        pathway: "ausbildung",
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
