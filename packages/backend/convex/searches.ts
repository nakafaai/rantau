import type { DataModel } from "@repo/backend/convex/_generated/dataModel";
import {
  internalMutation,
  query,
} from "@repo/backend/convex/_generated/server";
import { DISCOVERY_MODEL } from "@repo/backend/convex/lib/discover";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import {
  discoveryLaneResultValidator,
  MAX_SEARCH_LANES,
  searchWork,
} from "@repo/backend/convex/lib/searchwork";
import { opportunityValidator } from "@repo/backend/convex/model";
import schema from "@repo/backend/convex/schema";
import { ConvexError, v } from "convex/values";

const MAX_SEARCH_RESULTS = 100;
const laneContextValidator = v.object({
  laneId: v.id("searchLanes"),
  searchId: v.id("searches"),
  userId: v.id("users"),
});

/** Marks one Workpool lane as active without reopening a terminal lane. */
export const markLaneRunning = internalMutation({
  args: {
    laneId: v.id("searchLanes"),
    searchId: v.id("searches"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const lane = await ctx.db.get("searchLanes", args.laneId);
    if (
      !lane ||
      lane.searchId !== args.searchId ||
      lane.userId !== args.userId
    ) {
      throw new ConvexError({ code: "SEARCH_LANE_MISMATCH" });
    }
    if (lane.status === "queued") {
      await ctx.db.patch("searchLanes", lane._id, {
        status: "running",
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

/** Appends one unique result within the shared 100-result search budget. */
export const append = internalMutation({
  args: {
    opportunity: opportunityValidator,
    searchId: v.id("searches"),
    userId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const search = await ctx.db.get("searches", args.searchId);
    if (
      !search ||
      search.userId !== args.userId ||
      search.status !== "running"
    ) {
      throw new ConvexError({ code: "SEARCH_SESSION_MISMATCH" });
    }
    const resultCount = search.resultCount ?? 0;
    if (resultCount >= MAX_SEARCH_RESULTS) {
      return false;
    }

    const sameUrl = await ctx.db
      .query("opportunities")
      .withIndex("by_search_and_url", (index) =>
        index
          .eq("searchId", args.searchId)
          .eq("opportunity.directApplyUrl", args.opportunity.directApplyUrl)
      )
      .take(MAX_SEARCH_RESULTS);
    const title = args.opportunity.title.toLocaleLowerCase();
    if (
      sameUrl.some(
        (record) => record.opportunity.title.toLocaleLowerCase() === title
      )
    ) {
      return false;
    }

    await ctx.db.insert("opportunities", {
      opportunity: args.opportunity,
      searchId: args.searchId,
      userId: args.userId,
    });
    await ctx.db.patch("searches", args.searchId, {
      resultCount: resultCount + 1,
    });
    return true;
  },
});

/** Closes an unfinished search after its durable execution deadline. */
export const expire = internalMutation({
  args: {
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
      return null;
    }

    const completedAt = Date.now();
    const lanes = await ctx.db
      .query("searchLanes")
      .withIndex("by_search", (index) => index.eq("searchId", search._id))
      .take(MAX_SEARCH_LANES);
    await Promise.all(
      lanes
        .filter((lane) => lane.status === "queued" || lane.status === "running")
        .map((lane) =>
          ctx.db.patch("searchLanes", lane._id, {
            completedAt,
            error: "Search lane exceeded its execution deadline.",
            status: "failed",
            updatedAt: completedAt,
          })
        )
    );
    await ctx.db.patch("searches", search._id, {
      completedAt,
      error: "The search was interrupted.",
      status: "failed",
    });
    return null;
  },
});

/** Reduces every Workpool completion into one durable terminal search state. */
export const finishLane = searchWork.defineOnComplete<
  DataModel,
  typeof laneContextValidator,
  typeof discoveryLaneResultValidator
>({
  context: laneContextValidator,
  returnValue: discoveryLaneResultValidator,
  handler: async (ctx, { context, result }) => {
    const [lane, search] = await Promise.all([
      ctx.db.get("searchLanes", context.laneId),
      ctx.db.get("searches", context.searchId),
    ]);
    if (
      !(lane && search) ||
      lane.searchId !== context.searchId ||
      lane.userId !== context.userId ||
      search.userId !== context.userId
    ) {
      throw new ConvexError({ code: "SEARCH_LANE_MISMATCH" });
    }
    if (lane.status === "complete" || lane.status === "failed") {
      return;
    }

    const completedAt = Date.now();
    const completedLane =
      result.kind === "success"
        ? {
            completedAt,
            inputTokens: result.returnValue.inputTokens,
            outputTokens: result.returnValue.outputTokens,
            resultCount: result.returnValue.resultCount,
            status: "complete" as const,
            threadId: result.returnValue.threadId,
            updatedAt: completedAt,
          }
        : {
            completedAt,
            error:
              result.kind === "failed"
                ? result.error.slice(0, 500)
                : "Search lane canceled.",
            status: "failed" as const,
            updatedAt: completedAt,
          };
    await ctx.db.patch("searchLanes", lane._id, completedLane);
    if (search.status !== "running") {
      return;
    }

    const lanes = await ctx.db
      .query("searchLanes")
      .withIndex("by_search", (index) => index.eq("searchId", search._id))
      .take(MAX_SEARCH_LANES);
    const settled = lanes.map((record) =>
      record._id === lane._id ? { ...record, ...completedLane } : record
    );
    if (
      settled.some(
        (record) => record.status === "queued" || record.status === "running"
      )
    ) {
      return;
    }

    const successful = settled.filter((record) => record.status === "complete");
    if (search.resultCount === 0) {
      await ctx.db.patch("searches", search._id, {
        completedAt,
        error: "No source-backed opportunities were found.",
        status: "failed",
      });
      return;
    }

    await ctx.db.patch("searches", search._id, {
      completedAt,
      inputTokens: successful.reduce(
        (total, record) => total + (record.inputTokens ?? 0),
        0
      ),
      model: DISCOVERY_MODEL,
      outputTokens: successful.reduce(
        (total, record) => total + (record.outputTokens ?? 0),
        0
      ),
      status: "complete",
      threadId: successful
        .flatMap((record) => (record.threadId ? [record.threadId] : []))
        .join(","),
    });
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
    const search = await ctx.db
      .query("searches")
      .withIndex("by_user_createdAt", (index) => index.eq("userId", userId))
      .order("desc")
      .first();
    return search;
  },
});
