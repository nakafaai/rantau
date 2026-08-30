import { type ProviderBuilders, setupCore } from "@convex-dev/auth/core/setup";
import { validateNewPassword } from "@convex-dev/auth/providers/password/validation";
import { MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components, internal } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { normalizeIdentity, validatePassword } from "@repo/domain/identity";
import type { FunctionReference } from "convex/server";
import { v } from "convex/values";
import { Effect } from "effect";
import { Scrypt } from "lucia";

const core = setupCore({ component: components.auth });
export const { isAuthenticated, refreshSession, signOut } = core;

interface PasswordProfile {
  email: string;
  legacyUserId?: Id<"users">;
  name?: string;
}
type CreatePasswordUser = FunctionReference<
  "mutation",
  "internal",
  {
    profile: PasswordProfile;
    provider: "password";
    providerAccountId: string;
  },
  Id<"users">
>;
type LegacyPasswordQuery = FunctionReference<
  "query",
  "internal",
  { email: string },
  {
    name?: string;
    secret: string;
    userId: Id<"users">;
  } | null
>;
type ConsumePasswordMutation = FunctionReference<
  "mutation",
  "internal",
  { email: string; userId: Id<"users"> },
  null
>;

const passwordProvider: ProviderBuilders<PasswordProfile> = core.bindProvider({
  createUser: internal.accounts.createPasswordUser as CreatePasswordUser,
  name: "password",
});
const legacyPasswordQuery = internal.legacy.password as LegacyPasswordQuery;
const consumePasswordMutation = internal.legacy
  .consumePassword as ConsumePasswordMutation;
const migrationLimiter = new RateLimiter(components.rateLimiter, {
  passwordMigration: {
    capacity: 5,
    kind: "token bucket",
    period: MINUTE,
    rate: 1,
  },
});

const authError = v.union(
  v.literal("EMAIL_TAKEN"),
  v.literal("INVALID_CREDENTIALS"),
  v.literal("INVALID_INPUT"),
  v.literal("PASSWORD_TOO_COMMON"),
  v.literal("RATE_LIMITED"),
  v.literal("USER_NOT_FOUND")
);
const tokenBundle = v.object({
  accessToken: v.string(),
  accessTokenExpiresAt: v.number(),
  refreshToken: v.string(),
  refreshTokenExpiresAt: v.number(),
  userId: v.string(),
});
const signInResult = v.union(
  v.object({ success: v.literal(true), tokens: tokenBundle }),
  v.object({ error: authError, success: v.literal(false) })
);
const migrationResult = v.union(
  v.object({ success: v.literal(true) }),
  v.object({ error: authError, success: v.literal(false) })
);

/** Converts Effect identity policy failures into a public auth result. */
function identity(email: string, name: string) {
  return Effect.runSync(
    normalizeIdentity({ email, name }).pipe(
      Effect.map((profile) => ({ profile, success: true }) as const),
      Effect.catchTag("IdentityPolicyError", () =>
        Effect.succeed({ success: false } as const)
      )
    )
  );
}

/** Applies both Rantau and Convex Auth v2 password policies. */
function passwordError(password: string) {
  const rantau = Effect.runSync(
    validatePassword(password).pipe(
      Effect.as(true),
      Effect.catchTag("IdentityPolicyError", () => Effect.succeed(false))
    )
  );
  if (!rantau) {
    return "INVALID_INPUT" as const;
  }

  const componentError = validateNewPassword(password);
  if (!componentError) {
    return null;
  }
  return componentError.error === "PASSWORD_TOO_COMMON"
    ? ("PASSWORD_TOO_COMMON" as const)
    : ("INVALID_INPUT" as const);
}

export const signUpWithPassword = passwordProvider.authMutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
  },
  returns: signInResult,
  /** Creates a password account entirely inside the official v2 components. */
  handler: async (ctx, args) => {
    const normalized = identity(args.email, args.name);
    const policyError = passwordError(args.password);
    if (!(normalized.success && !policyError)) {
      return {
        error: policyError ?? "INVALID_INPUT",
        success: false,
      } as const;
    }

    const existing = await ctx.runQuery(
      components.authUsername.public.getUserIdByUsername,
      { username: normalized.profile.email }
    );
    if (existing) {
      return { error: "EMAIL_TAKEN", success: false } as const;
    }

    const tokens = await ctx.convexAuth.completeSignUp({
      profile: {
        email: normalized.profile.email,
        name: normalized.profile.name,
      },
      providerAccountId: "",
    });
    const username = await ctx.runMutation(
      components.authUsername.public.setUsername,
      { userId: tokens.userId, username: normalized.profile.email }
    );
    const password = await ctx.runMutation(
      components.authPasswordProvider.public.setPassword,
      { password: args.password, userId: tokens.userId }
    );
    if (!(username.success && password.success)) {
      throw new Error("Convex Auth rejected prevalidated credentials.");
    }

    return { success: true, tokens } as const;
  },
});

export const signInWithPassword = passwordProvider.authMutation({
  args: { email: v.string(), password: v.string() },
  returns: signInResult,
  /** Verifies an Argon2id password and mints the v2 session bundle. */
  handler: async (ctx, args) => {
    const normalized = identity(args.email, "");
    if (!normalized.success) {
      return { error: "INVALID_CREDENTIALS", success: false } as const;
    }

    const userId = await ctx.runQuery(
      components.authUsername.public.getUserIdByUsername,
      { username: normalized.profile.email }
    );
    if (!userId) {
      return { error: "USER_NOT_FOUND", success: false } as const;
    }

    const verified = await ctx.runMutation(
      components.authPasswordProvider.public.verifyPassword,
      { password: args.password, userId }
    );
    if (!verified.success) {
      return {
        error:
          verified.userError.error === "RATE_LIMITED"
            ? "RATE_LIMITED"
            : "INVALID_CREDENTIALS",
        success: false,
      } as const;
    }

    const tokens = await ctx.convexAuth.completeSignIn({
      profile: { email: normalized.profile.email },
      providerAccountId: userId,
    });
    return { success: true, tokens } as const;
  },
});

export const migratePassword = passwordProvider.authAction({
  args: {
    email: v.string(),
    newPassword: v.optional(v.string()),
    password: v.string(),
  },
  returns: migrationResult,
  /** Upgrades a verified v1 Scrypt credential into v2 Argon2id components. */
  handler: async (ctx, args) => {
    const normalized = identity(args.email, "");
    if (!normalized.success) {
      return { error: "INVALID_CREDENTIALS", success: false } as const;
    }

    const limit = await migrationLimiter.limit(ctx, "passwordMigration", {
      key: normalized.profile.email,
    });
    if (!limit.ok) {
      return { error: "RATE_LIMITED", success: false } as const;
    }

    const legacy = await ctx.runQuery(legacyPasswordQuery, {
      email: normalized.profile.email,
    });
    if (!legacy) {
      return { error: "INVALID_CREDENTIALS", success: false } as const;
    }

    const matches = await new Scrypt().verify(legacy.secret, args.password);
    if (!matches) {
      return { error: "INVALID_CREDENTIALS", success: false } as const;
    }

    const nextPassword = args.newPassword ?? args.password;
    const policyError = passwordError(nextPassword);
    if (policyError) {
      return { error: policyError, success: false } as const;
    }

    const username = await ctx.runMutation(
      components.authUsername.public.setUsername,
      { userId: legacy.userId, username: normalized.profile.email }
    );
    const password = await ctx.runMutation(
      components.authPasswordProvider.public.setPassword,
      { password: nextPassword, userId: legacy.userId }
    );
    if (!(username.success && password.success)) {
      return {
        error: password.success ? "INVALID_INPUT" : "PASSWORD_TOO_COMMON",
        success: false,
      } as const;
    }

    const existing = await ctx.convexAuth.resolveUserId(legacy.userId);
    if (!existing) {
      await ctx.convexAuth.signUpWithoutSession({
        profile: {
          email: normalized.profile.email,
          legacyUserId: legacy.userId as Id<"users">,
          name: legacy.name,
        },
        providerAccountId: legacy.userId,
      });
    } else if (existing !== legacy.userId) {
      throw new Error("The migrated password account belongs to another user.");
    }

    await ctx.runMutation(consumePasswordMutation, {
      email: normalized.profile.email,
      userId: legacy.userId,
    });

    return { success: true } as const;
  },
});
