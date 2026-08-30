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

  it.effect("rejects short passwords", () =>
    Effect.gen(function* () {
      const error = yield* validatePassword("short").pipe(Effect.flip);

      expect(error.message).toContain("10 characters");
    })
  );

  it.effect("accepts a policy-compliant password", () =>
    Effect.gen(function* () {
      const password = yield* validatePassword("long-enough");

      expect(password).toBe("long-enough");
    })
  );

  it.effect("derives a fallback display name", () =>
    Effect.gen(function* () {
      const fromEmail = yield* normalizeIdentity({
        email: "person@example.com",
        name: "",
      });
      const generic = yield* normalizeIdentity({
        email: "@example.com",
        name: null,
      });

      expect(fromEmail.name).toBe("person");
      expect(generic.name).toBe("Rantau member");
    })
  );
});
