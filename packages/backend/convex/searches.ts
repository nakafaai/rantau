import {
  internalMutation,
  query,
} from "@repo/backend/convex/_generated/server";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import { opportunityValidator } from "@repo/backend/convex/model";
import schema from "@repo/backend/convex/schema";
import { v } from "convex/values";

export const start = internalMutation({
  args: {
    locale: v.union(v.literal("en"), v.literal("id")),
    query: v.string(),
    userId: v.id("users"),
  },
  returns: v.id("searches"),
  handler: (ctx, args) =>
    ctx.db.insert("searches", {
      createdAt: Date.now(),
      locale: args.locale,
      query: args.query,
      status: "running",
      userId: args.userId,
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("searches", args.searchId, {
      completedAt: Date.now(),
      error: args.error,
      status: "failed",
    });
    return null;
  },
});

export const list = query({
  args: {},
  returns: v.array(schema.doc("searches")),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return ctx.db
      .query("searches")
      .withIndex("by_user_createdAt", (index) => index.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});
