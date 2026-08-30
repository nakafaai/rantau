import { describe, expect, it } from "@effect/vitest";
import { makeSearchIntent } from "@repo/domain/search";
import { Effect, Exit } from "effect";

describe("makeSearchIntent", () => {
  it.effect("normalizes useful queries", () =>
    Effect.gen(function* () {
      const intent = yield* makeSearchIntent({
        locale: "id",
        query: "  kerja   perawat di Jepang  ",
      });
      expect(intent).toEqual({
        locale: "id",
        query: "kerja perawat di Jepang",
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
