import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { normalizeIdentity, validatePassword } from "@repo/domain/identity";
import { Effect } from "effect";

/** Runs the Effect identity policy at the synchronous Convex Auth boundary. */
function runIdentityPolicy(params: Record<string, unknown>) {
  const outcome = Effect.runSync(
    normalizeIdentity({ email: params.email, name: params.name }).pipe(
      Effect.map((profile) => ({ profile, success: true }) as const),
      Effect.catchTag("IdentityPolicyError", (error) =>
        Effect.succeed({ message: error.message, success: false } as const)
      )
    )
  );

  if (!outcome.success) {
    throw new Error(outcome.message);
  }

  return outcome.profile;
}

/** Runs the Effect password policy at the synchronous provider boundary. */
function runPasswordPolicy(password: string) {
  const outcome = Effect.runSync(
    validatePassword(password).pipe(
      Effect.as({ success: true } as const),
      Effect.catchTag("IdentityPolicyError", (error) =>
        Effect.succeed({ message: error.message, success: false } as const)
      )
    )
  );

  if (!outcome.success) {
    throw new Error(outcome.message);
  }
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      /** Normalizes the candidate identity stored by Convex Auth. */
      profile(params) {
        return runIdentityPolicy(params);
      },
      /** Applies the product password policy before credentials are stored. */
      validatePasswordRequirements(password) {
        runPasswordPolicy(password);
      },
    }),
  ],
});
