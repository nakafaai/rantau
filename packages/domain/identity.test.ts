import { describe, expect, it } from "@effect/vitest";
import { normalizeIdentity, validatePassword } from "@repo/domain/identity";
import { Effect } from "effect";

describe("identity policy", () => {
  it.effect("normalizes valid identity data", () =>
    Effect.gen(function* () {
      const profile = yield* normalizeIdentity({
        email: "  PERSON@EXAMPLE.COM ",
        name: "  Nabil ",
      });

      expect(profile).toEqual({ email: "person@example.com", name: "Nabil" });
    })
  );

  it.effect("rejects invalid email data", () =>
    Effect.gen(function* () {
      const error = yield* normalizeIdentity({
        email: "person",
        name: "",
      }).pipe(Effect.flip);

      expect(error._tag).toBe("IdentityPolicyError");
    })
  );

  it.effect("rejects an oversized email", () =>
    Effect.gen(function* () {
      const error = yield* normalizeIdentity({
        email: `${"a".repeat(309)}@example.com`,
        name: "Person",
      }).pipe(Effect.flip);

      expect(error.message).toBe("Enter a valid email address.");
    })
  );

  it.effect("rejects short passwords", () =>
    Effect.gen(function* () {
      const error = yield* validatePassword("short").pipe(Effect.flip);

      expect(error.message).toContain("12 to 100 characters");
    })
  );

  it.effect("accepts a policy-compliant password", () =>
    Effect.gen(function* () {
      const password = yield* validatePassword("long-enough!");

      expect(password).toBe("long-enough!");
    })
  );

  it.effect("rejects an oversized password", () =>
    Effect.gen(function* () {
      const error = yield* validatePassword("a".repeat(101)).pipe(Effect.flip);

      expect(error.message).toContain("12 to 100 characters");
    })
  );

  it.effect("derives a fallback display name", () =>
    Effect.gen(function* () {
      const fromEmail = yield* normalizeIdentity({
        email: "person@example.com",
        name: "",
      });
      expect(fromEmail.name).toBe("person");
    })
  );

  it.effect("rejects an email without a local part", () =>
    Effect.gen(function* () {
      const error = yield* normalizeIdentity({
        email: "@example.com",
        name: "Person",
      }).pipe(Effect.flip);

      expect(error._tag).toBe("IdentityPolicyError");
    })
  );

  it.effect("rejects an oversized display name", () =>
    Effect.gen(function* () {
      const error = yield* normalizeIdentity({
        email: "person@example.com",
        name: "N".repeat(121),
      }).pipe(Effect.flip);

      expect(error.message).toContain("under 120 characters");
    })
  );
});
