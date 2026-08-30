import { query } from "@repo/backend/convex/_generated/server";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import { ConvexError, v } from "convex/values";

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
