import { Effect, Schema } from "effect";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
export const MAXIMUM_EMAIL_LENGTH = 320;
export const MAXIMUM_NAME_LENGTH = 120;
export const MAXIMUM_PASSWORD_LENGTH = 100;
export const MINIMUM_PASSWORD_LENGTH = 12;

export const IdentityEmail = Schema.Trim.pipe(
  Schema.check(Schema.isMaxLength(MAXIMUM_EMAIL_LENGTH)),
  Schema.check(Schema.isPattern(EMAIL_PATTERN))
);
export const IdentityName = Schema.Trim.pipe(
  Schema.check(Schema.isMaxLength(MAXIMUM_NAME_LENGTH))
);
export const IdentityPassword = Schema.String.pipe(
  Schema.check(Schema.isMinLength(MINIMUM_PASSWORD_LENGTH)),
  Schema.check(Schema.isMaxLength(MAXIMUM_PASSWORD_LENGTH))
);

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
  const email = yield* Schema.decodeUnknownEffect(IdentityEmail)(
    String(input.email ?? "")
  ).pipe(
    Effect.map((value) => value.toLocaleLowerCase()),
    Effect.mapError(
      () => new IdentityPolicyError({ message: "Enter a valid email address." })
    )
  );
  const name = yield* Schema.decodeUnknownEffect(IdentityName)(
    String(input.name ?? "")
  ).pipe(
    Effect.mapError(
      () =>
        new IdentityPolicyError({
          message: `Keep your name under ${MAXIMUM_NAME_LENGTH} characters.`,
        })
    )
  );

  return {
    email,
    name: name || email.split("@")[0] || "Rantau member",
  } satisfies IdentityProfile;
});

/** Enforces the Rantau password policy as a typed Effect program. */
export const validatePassword = Effect.fn("identity.validatePassword")(
  function* (password: string) {
    return yield* Schema.decodeUnknownEffect(IdentityPassword)(password).pipe(
      Effect.mapError(
        () =>
          new IdentityPolicyError({
            message: `Use ${MINIMUM_PASSWORD_LENGTH} to ${MAXIMUM_PASSWORD_LENGTH} characters for your password.`,
          })
      )
    );
  }
);
