import { internal } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import type { MutationCtx } from "@repo/backend/convex/_generated/server";
import { searchWork } from "@repo/backend/convex/lib/searchwork";
import {
  type DiscoveryStage,
  discoveryLanes,
} from "@repo/domain/discoveryplan";
import type { SearchIntent } from "@repo/domain/search";
import { Effect } from "effect";

/** Persists and enqueues one bounded adaptive discovery stage atomically. */
export const enqueueDiscoveryStage: (
  ctx: MutationCtx,
  searchId: Id<"searches">,
  userId: Id<"users">,
  intent: SearchIntent,
  stage: DiscoveryStage,
  createdAt: number
) => Effect.Effect<void> = Effect.fn("search.enqueueStage")(function* (
  ctx: MutationCtx,
  searchId: Id<"searches">,
  userId: Id<"users">,
  intent: SearchIntent,
  stage: DiscoveryStage,
  createdAt: number
) {
  yield* Effect.forEach(
    discoveryLanes(intent, stage),
    (lane) =>
      Effect.gen(function* () {
        const laneId = yield* Effect.promise(() =>
          ctx.db.insert("searchLanes", {
            limit: lane.limit,
            market: lane.market,
            searchId,
            sourceQuery: lane.sourceQuery,
            stage,
            status: "queued",
            updatedAt: createdAt,
            userId,
          })
        );
        const workId: WorkId = yield* Effect.promise(() =>
          searchWork.enqueueAction(
            ctx,
            internal.opportunities.executeLane,
            { laneId, searchId, userId },
            {
              context: { laneId, searchId, userId },
              onComplete: internal.searchlane.finishLane,
              retry: false,
            }
          )
        );
        yield* Effect.promise(() =>
          ctx.db.patch("searchLanes", laneId, { workId })
        );
      }),
    { concurrency: 1, discard: true }
  );
});

import type { WorkId } from "@convex-dev/workpool";
