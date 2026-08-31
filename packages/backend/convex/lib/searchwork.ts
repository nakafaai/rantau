import { Workpool } from "@convex-dev/workpool";
import { components } from "@repo/backend/convex/_generated/api";
import type { Doc } from "@repo/backend/convex/_generated/dataModel";
import type { MutationCtx } from "@repo/backend/convex/_generated/server";
import { searchLimitationValidator } from "@repo/backend/convex/model";
import { v } from "convex/values";

export const MAX_SEARCH_LANES = 20;
export const DISCOVERY_LANE_TIMEOUT_MS = 2 * 60 * 1000;
export const SEARCH_TIMEOUT_MS = 12 * 60 * 1000;

export type DiscoveryLaneResult =
  | Readonly<{
      inputTokens: number;
      kind: "success";
      outputTokens: number;
      resultCount: number;
      threadId: string;
    }>
  | Readonly<{
      error: string;
      kind: "failed";
      limitation?: "deadline" | "source_capacity" | "source_exhausted";
    }>;

export const searchWork = new Workpool(components.searchWorkpool, {
  maxParallelism: 3,
  retryActionsByDefault: false,
});

/** Cancels unfinished provider work and records why each lane stopped. */
export async function stopSearchLanes(
  ctx: MutationCtx,
  lanes: readonly Doc<"searchLanes">[],
  completedAt: number,
  error: string,
  limitation?: "deadline" | "source_capacity" | "source_exhausted"
) {
  await Promise.all(
    lanes
      .filter((lane) => lane.status === "queued" || lane.status === "running")
      .map(async (lane) => {
        if (lane.workId) {
          await searchWork.cancel(ctx, lane.workId);
        }
        await ctx.db.patch("searchLanes", lane._id, {
          completedAt,
          error,
          limitation,
          status: "failed",
          updatedAt: completedAt,
        });
      })
  );
}

export const discoveryLaneResultValidator = v.union(
  v.object({
    inputTokens: v.number(),
    kind: v.literal("success"),
    outputTokens: v.number(),
    resultCount: v.number(),
    threadId: v.string(),
  }),
  v.object({
    error: v.string(),
    kind: v.literal("failed"),
    limitation: v.optional(searchLimitationValidator),
  })
);
