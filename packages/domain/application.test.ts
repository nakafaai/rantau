import { describe, expect, it } from "@effect/vitest";
import { validateApplicationTransition } from "@repo/domain/application";
import { Effect, Exit } from "effect";

describe("validateApplicationTransition", () => {
  it.effect("accepts a valid forward transition", () =>
    Effect.gen(function* () {
      expect(yield* validateApplicationTransition("saved", "applied")).toBe(
        "applied"
      );
    })
  );

  it.effect("rejects an invalid terminal transition", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        validateApplicationTransition("accepted", "rejected")
      );
      expect(Exit.isFailure(exit)).toBe(true);
    })
  );
});
