import {
  internalMutation,
  internalQuery,
  type QueryCtx,
} from "@repo/backend/convex/_generated/server";
import { defineTable } from "convex/server";
import { v } from "convex/values";

/** Retains v1 rows while each password is upgraded to the v2 components. */
export const legacyAuthTables = {
  authAccounts: defineTable({
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
    provider: v.string(),
    providerAccountId: v.string(),
    secret: v.optional(v.string()),
    userId: v.id("users"),
  })
    .index("userIdAndProvider", ["userId", "provider"])
    .index("providerAndAccountId", ["provider", "providerAccountId"]),
  authRateLimits: defineTable({
    attemptsLeft: v.number(),
    identifier: v.string(),
    lastAttemptTime: v.number(),
  }).index("identifier", ["identifier"]),
  authRefreshTokens: defineTable({
    expirationTime: v.number(),
    firstUsedTime: v.optional(v.number()),
    parentRefreshTokenId: v.optional(v.id("authRefreshTokens")),
    sessionId: v.id("authSessions"),
  })
    .index("sessionId", ["sessionId"])
    .index("sessionIdAndParentRefreshTokenId", [
      "sessionId",
      "parentRefreshTokenId",
    ]),
  authSessions: defineTable({
    expirationTime: v.number(),
    userId: v.id("users"),
  }).index("userId", ["userId"]),
  authVerificationCodes: defineTable({
    accountId: v.id("authAccounts"),
    code: v.string(),
    emailVerified: v.optional(v.string()),
    expirationTime: v.number(),
    phoneVerified: v.optional(v.string()),
    provider: v.string(),
    verifier: v.optional(v.string()),
  })
    .index("accountId", ["accountId"])
    .index("code", ["code"]),
  authVerifiers: defineTable({
    sessionId: v.optional(v.id("authSessions")),
    signature: v.optional(v.string()),
  }).index("signature", ["signature"]),
};

/** Finds the exact v1 password account without exposing its hash publicly. */
async function legacyPassword(ctx: QueryCtx, { email }: { email: string }) {
  const account = await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (query) =>
      query.eq("provider", "password").eq("providerAccountId", email)
    )
    .unique();
  if (!account?.secret) {
    return null;
  }

  const user = await ctx.db.get("users", account.userId);
  if (!user || user.email !== email) {
    return null;
  }

  return {
    name: user.name,
    secret: account.secret,
    userId: user._id,
  };
}

export const password = internalQuery({
  args: { email: v.string() },
  returns: v.union(
    v.object({
      name: v.optional(v.string()),
      secret: v.string(),
      userId: v.id("users"),
    }),
    v.null()
  ),
  handler: legacyPassword,
});

export const consumePassword = internalMutation({
  args: { email: v.string(), userId: v.id("users") },
  returns: v.null(),
  /** Deletes the exact v1 password hash after its v2 account is durable. */
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (query) =>
        query.eq("provider", "password").eq("providerAccountId", args.email)
      )
      .unique();
    if (account && account.userId === args.userId) {
      await ctx.db.delete("authAccounts", account._id);
    }
    return null;
  },
});
