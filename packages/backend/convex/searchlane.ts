import type { DataModel } from "@repo/backend/convex/_generated/dataModel";
import { DISCOVERY_MODEL } from "@repo/backend/convex/lib/discover";
import { enqueueDiscoveryStage } from "@repo/backend/convex/lib/searchqueue";
import { searchIntent } from "@repo/backend/convex/lib/searchsession";
import {
  discoveryLaneResultValidator,
  MAX_SEARCH_LANES,
  searchWork,
} from "@repo/backend/convex/lib/searchwork";
import { SEARCH_RESULT_TARGET } from "@repo/domain/discoveryplan";
import { ConvexError, v } from "convex/values";
import { Effect } from "effect";

const laneContextValidator = v.object({
  laneId: v.id("searchLanes"),
  searchId: v.id("searches"),
  userId: v.id("users"),
});
const SOURCE_CAPACITY_PATTERN =
  /(?:Insufficient credits|Rate limit exceeded|"status":40[29])/u;

/** Detects a terminal Firecrawl credit or rate boundary from internal errors. */
function sourceCapacityReached(
  lanes: readonly {
    error?: string;
    limitation?: "deadline" | "source_capacity" | "source_exhausted";
    status: string;
  }[]
) {
  return lanes.some(
    (lane) =>
      lane.status === "failed" &&
      (lane.limitation === "source_capacity" ||
        SOURCE_CAPACITY_PATTERN.test(lane.error ?? ""))
  );
}

/** Summarizes successful lane usage without exposing incomplete lane records. */
function successfulSummary(
  lanes: readonly {
    inputTokens?: number;
    outputTokens?: number;
    threadId?: string;
  }[]
) {
  return {
    inputTokens: lanes.reduce(
      (total, record) => total + (record.inputTokens ?? 0),
      0
    ),
    outputTokens: lanes.reduce(
      (total, record) => total + (record.outputTokens ?? 0),
      0
    ),
    threadId: lanes
      .flatMap((record) => (record.threadId ? [record.threadId] : []))
      .join(","),
  };
}

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
    const laneResult =
      result.kind === "success" ? result.returnValue : undefined;
    let failureError = "Search lane canceled.";
    let failureLimitation:
      | "deadline"
      | "source_capacity"
      | "source_exhausted"
      | undefined;
    if (laneResult?.kind === "failed") {
      failureError = laneResult.error.slice(0, 500);
      failureLimitation = laneResult.limitation;
    } else if (result.kind === "failed") {
      failureError = result.error.slice(0, 500);
    }
    const completedLane =
      laneResult?.kind === "success"
        ? {
            completedAt,
            inputTokens: laneResult.inputTokens,
            outputTokens: laneResult.outputTokens,
            resultCount: laneResult.resultCount,
            status: "complete" as const,
            threadId: laneResult.threadId,
            updatedAt: completedAt,
          }
        : {
            completedAt,
            error: failureError,
            limitation: failureLimitation,
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
    const successful = settled.filter((record) => record.status === "complete");
    const usage = successfulSummary(successful);
    const resultCount = search.resultCount ?? 0;
    if (completedLane.limitation === "source_capacity") {
      await Promise.all(
        settled
          .filter(
            (record) =>
              record.status === "queued" || record.status === "running"
          )
          .map((record) =>
            ctx.db.patch("searchLanes", record._id, {
              completedAt,
              error: "Search source capacity was reached.",
              limitation: "source_capacity",
              status: "failed",
              updatedAt: completedAt,
            })
          )
      );
      await ctx.db.patch("searches", search._id, {
        completedAt,
        ...(resultCount === 0
          ? {
              error: "No source-backed opportunities were found.",
              limitation: "source_capacity" as const,
              status: "failed" as const,
            }
          : {
              ...usage,
              limitation: "source_capacity" as const,
              model: DISCOVERY_MODEL,
              outcome: "partial" as const,
              status: "complete" as const,
            }),
      });
      return;
    }
    if (
      settled.some(
        (record) => record.status === "queued" || record.status === "running"
      )
    ) {
      return;
    }

    const atSourceCapacity = sourceCapacityReached(settled);
    if (
      search.stage === "initial" &&
      resultCount < SEARCH_RESULT_TARGET &&
      !atSourceCapacity
    ) {
      await ctx.db.patch("searches", search._id, { stage: "expansion" });
      await Effect.runPromise(
        enqueueDiscoveryStage(
          ctx,
          search._id,
          search.userId,
          searchIntent(search),
          "expansion",
          completedAt
        )
      );
      return;
    }

    if (resultCount === 0) {
      await ctx.db.patch("searches", search._id, {
        completedAt,
        error: "No source-backed opportunities were found.",
        limitation: atSourceCapacity ? "source_capacity" : "source_exhausted",
        status: "failed",
      });
      return;
    }

    let limitation: "source_capacity" | "source_exhausted" | undefined;
    if (resultCount < SEARCH_RESULT_TARGET) {
      limitation = atSourceCapacity ? "source_capacity" : "source_exhausted";
    }

    await ctx.db.patch("searches", search._id, {
      completedAt,
      ...usage,
      model: DISCOVERY_MODEL,
      limitation,
      outcome: resultCount >= SEARCH_RESULT_TARGET ? "target_met" : "partial",
      status: "complete",
    });
  },
});
