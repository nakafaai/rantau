import {
  internalMutation,
  query,
} from "@repo/backend/convex/_generated/server";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import { ConvexError, v } from "convex/values";

export const createPasswordUser = internalMutation({
  args: {
    profile: v.object({
      email: v.string(),
      legacyUserId: v.optional(v.id("users")),
      name: v.optional(v.string()),
    }),
    provider: v.literal("password"),
    providerAccountId: v.string(),
  },
  returns: v.id("users"),
  /** Creates a v2 user or safely reuses the verified v1 user during upgrade. */
  handler: async (ctx, { profile }) => {
    if (profile.legacyUserId) {
      const existing = await ctx.db.get("users", profile.legacyUserId);
      if (!existing || existing.email !== profile.email) {
        throw new Error("The legacy account no longer matches this identity.");
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      email: profile.email,
      name: profile.name,
    });
  },
});

/** Returns the signed-in identity needed by the workspace account menu. */
export const current = query({
  args: {},
  returns: v.object({
    email: v.string(),
    image: v.union(v.string(), v.null()),
    name: v.string(),
  }),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get("users", userId);
    if (!user) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }

    const email = user.email ?? "";
    return {
      email,
      image: user.image ?? null,
      name: user.name ?? email.split("@")[0] ?? "Rantau",
    };
  },
});
