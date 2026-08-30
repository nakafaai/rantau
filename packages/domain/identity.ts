import { Effect, Schema } from "effect";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const MAXIMUM_EMAIL_LENGTH = 320;
const MAXIMUM_NAME_LENGTH = 120;
const MAXIMUM_PASSWORD_LENGTH = 256;
const MINIMUM_PASSWORD_LENGTH = 12;

export const IdentityProfile = Schema.Struct({
  email: Schema.String,
  name: Schema.String,
});
export type IdentityProfile = Schema.Schema.Type<typeof IdentityProfile>;

export class IdentityPolicyError extends Schema.TaggedError<IdentityPolicyError>()(
  "IdentityPolicyError",
  {
    message: Schema.String,
  }
) {}

/** Normalizes and validates credentials before Convex Auth stores them. */
export const normalizeIdentity = Effect.fn("identity.normalize")(function* (
  input: Readonly<{ email: unknown; name: unknown }>
) {
  const email = String(input.email ?? "")
    .trim()
    .toLocaleLowerCase();
  const name = String(input.name ?? "").trim();

  if (email.length > MAXIMUM_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return yield* Effect.fail(
      new IdentityPolicyError({ message: "Enter a valid email address." })
    );
  }
  if (name.length > MAXIMUM_NAME_LENGTH) {
    return yield* Effect.fail(
      new IdentityPolicyError({
        message: "Keep your name under 120 characters.",
      })
    );
  }

  return {
    email,
    name: name || email.split("@")[0] || "Rantau member",
  } satisfies IdentityProfile;
});

/** Enforces the Rantau password policy as a typed Effect program. */
export const validatePassword = Effect.fn("identity.validatePassword")(
  function* (password: string) {
    if (
      password.length < MINIMUM_PASSWORD_LENGTH ||
      password.length > MAXIMUM_PASSWORD_LENGTH
    ) {
      return yield* Effect.fail(
        new IdentityPolicyError({
          message: `Use ${MINIMUM_PASSWORD_LENGTH} to ${MAXIMUM_PASSWORD_LENGTH} characters for your password.`,
        })
      );
    }

    return password;
  }
);
