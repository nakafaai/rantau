import {
  internalMutation,
  internalQuery,
} from "@repo/backend/convex/_generated/server";
import { searchIntent } from "@repo/backend/convex/lib/searchsession";
import {
  localeValidator,
  pathwayValidator,
  placeScopeValidator,
  workModeValidator,
} from "@repo/backend/convex/model";
import { ConvexError, v } from "convex/values";

/** Loads one queued lane and its immutable intent at the Workpool seam. */
export const laneInput = internalQuery({
  args: {
    laneId: v.id("searchLanes"),
    searchId: v.id("searches"),
    userId: v.id("users"),
  },
  returns: v.object({
    limit: v.number(),
    locale: localeValidator,
    market: v.string(),
    pathway: v.optional(pathwayValidator),
    place: v.optional(placeScopeValidator),
    query: v.string(),
    sourceQuery: v.string(),
    workMode: v.optional(workModeValidator),
  }),
  handler: async (ctx, args) => {
    const [lane, search] = await Promise.all([
      ctx.db.get("searchLanes", args.laneId),
      ctx.db.get("searches", args.searchId),
    ]);
    if (
      !(lane && search) ||
      lane.searchId !== args.searchId ||
      lane.userId !== args.userId ||
      search.userId !== args.userId ||
      (lane.status !== "queued" && lane.status !== "running") ||
      lane.limit === undefined ||
      lane.sourceQuery === undefined
    ) {
      throw new ConvexError({ code: "SEARCH_LANE_MISMATCH" });
    }
    const intent = searchIntent(search);
    return {
      limit: lane.limit,
      locale: intent.locale,
      market: lane.market,
      pathway: intent.pathway,
      place: intent.place,
      query: intent.query,
      sourceQuery: lane.sourceQuery,
      workMode: intent.workMode,
    };
  },
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
