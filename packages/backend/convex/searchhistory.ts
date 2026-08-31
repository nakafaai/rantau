import { query } from "@repo/backend/convex/_generated/server";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import schema from "@repo/backend/convex/schema";
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { v } from "convex/values";

/** Returns one durable search session only to its owning user. */
export const get = query({
  args: { searchId: v.id("searches") },
  returns: v.union(schema.doc("searches"), v.null()),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const search = await ctx.db.get("searches", args.searchId);
    return search?.userId === userId ? search : null;
  },
});

/** Resolves one route search key without trusting it as a Convex identifier. */
export const byKey = query({
  args: { searchKey: v.string() },
  returns: v.union(schema.doc("searches"), v.null()),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const searchId = ctx.db.normalizeId("searches", args.searchKey);
    if (!searchId) {
      return null;
    }
    const search = await ctx.db.get("searches", searchId);
    return search?.userId === userId ? search : null;
  },
});

/** Pages the current user's durable search history from newest to oldest. */
export const history = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(schema.doc("searches")),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return ctx.db
      .query("searches")
      .withIndex("by_user_createdAt", (index) => index.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/** Returns the current user's latest durable search session. */
export const latest = query({
  args: {},
  returns: v.union(schema.doc("searches"), v.null()),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return ctx.db
      .query("searches")
      .withIndex("by_user_createdAt", (index) => index.eq("userId", userId))
      .order("desc")
      .first();
  },
});
