import {
  internalMutation,
  query,
} from "@repo/backend/convex/_generated/server";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import {
  opportunityValidator,
  pathwayValidator,
  workModeValidator,
} from "@repo/backend/convex/model";
import schema from "@repo/backend/convex/schema";
import { ConvexError, v } from "convex/values";

export const start = internalMutation({
  args: {
    country: v.optional(v.string()),
    locale: v.union(v.literal("en"), v.literal("id")),
    pathway: v.optional(pathwayValidator),
    query: v.string(),
    userId: v.id("users"),
    workMode: v.optional(workModeValidator),
  },
  returns: v.id("searches"),
  handler: (ctx, args) =>
    ctx.db.insert("searches", {
      country: args.country,
      createdAt: Date.now(),
      locale: args.locale,
      pathway: args.pathway,
      query: args.query,
      status: "running",
      userId: args.userId,
      workMode: args.workMode,
    }),
});

export const complete = internalMutation({
  args: {
    inputTokens: v.optional(v.number()),
    model: v.string(),
    opportunities: v.array(opportunityValidator),
    outputTokens: v.optional(v.number()),
    searchId: v.id("searches"),
    threadId: v.string(),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const search = await ctx.db.get("searches", args.searchId);
    if (
      !search ||
      search.userId !== args.userId ||
      search.status !== "running"
    ) {
      throw new ConvexError({ code: "SEARCH_SESSION_MISMATCH" });
    }

    await Promise.all(
      args.opportunities.map((opportunity) =>
        ctx.db.insert("opportunities", {
          fingerprint: `${opportunity.directApplyUrl}#${opportunity.title.toLocaleLowerCase()}`,
          opportunity,
          searchId: args.searchId,
          userId: args.userId,
        })
      )
    );

    await ctx.db.patch("searches", args.searchId, {
      completedAt: Date.now(),
      inputTokens: args.inputTokens,
      model: args.model,
      outputTokens: args.outputTokens,
      resultCount: args.opportunities.length,
      status: "complete",
      threadId: args.threadId,
    });
    return null;
  },
});

export const fail = internalMutation({
  args: {
    error: v.string(),
    searchId: v.id("searches"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const search = await ctx.db.get("searches", args.searchId);
    if (
      !search ||
      search.userId !== args.userId ||
      search.status !== "running"
    ) {
      throw new ConvexError({ code: "SEARCH_SESSION_MISMATCH" });
    }

    await ctx.db.patch("searches", args.searchId, {
      completedAt: Date.now(),
      error: args.error,
      status: "failed",
    });
    return null;
  },
});

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
