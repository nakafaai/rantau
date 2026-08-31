/// <reference types="vite/client" />

import type { WorkId } from "@convex-dev/workpool";
import workpoolTest from "@convex-dev/workpool/test";
import { describe, expect, it } from "@effect/vitest";
import { internal } from "@repo/backend/convex/_generated/api";
import schema from "@repo/backend/convex/schema";
import { convexTest } from "convex-test";

const modules = import.meta.glob("./**/*.ts");

describe("search lane lifecycle", () => {
  it("expands a sparse initial search with four additional lanes", async () => {
    const test = convexTest(schema, modules);
    workpoolTest.register(test, "searchWorkpool");
    const userId = await test.run((ctx) => ctx.db.insert("users", {}));
    const searchId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        country: "Indonesia",
        countryCode: "ID",
        createdAt: 1,
        locale: "id",
        query: "dokter",
        resultCount: 38,
        stage: "initial",
        status: "running",
        userId,
      })
    );
    const laneId = await test.run((ctx) =>
      ctx.db.insert("searchLanes", {
        limit: 20,
        market: "Indonesia",
        searchId,
        sourceQuery: "dokter Indonesia",
        stage: "initial",
        status: "queued",
        updatedAt: 1,
        userId,
      })
    );

    await test.mutation(internal.searchlane.finishLane, {
      context: { laneId, searchId, userId },
      result: { kind: "canceled" },
      workId: "work-expand" as WorkId,
    });

    const state = await test.run(async (ctx) => ({
      lanes: await ctx.db
        .query("searchLanes")
        .withIndex("by_search", (index) => index.eq("searchId", searchId))
        .collect(),
      search: await ctx.db.get("searches", searchId),
    }));
    expect(state.search).toMatchObject({
      stage: "expansion",
      status: "running",
    });
    expect(
      state.lanes.filter((lane) => lane.stage === "expansion")
    ).toHaveLength(4);
  });

  it("reduces successful and failed lanes into one partial search", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) => ctx.db.insert("users", {}));
    const searchId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        createdAt: 1,
        locale: "id",
        query: "dokter",
        resultCount: 1,
        status: "running",
        userId,
      })
    );
    const [firstId, secondId] = await test.run(async (ctx) => {
      const first = await ctx.db.insert("searchLanes", {
        market: "Germany",
        searchId,
        status: "queued",
        updatedAt: 1,
        userId,
      });
      const second = await ctx.db.insert("searchLanes", {
        market: "Indonesia",
        searchId,
        status: "running",
        updatedAt: 1,
        userId,
      });
      await ctx.db.insert("searchLanes", {
        market: "Canceled after capacity",
        searchId,
        status: "queued",
        updatedAt: 1,
        userId,
      });
      return [first, second] as const;
    });

    await test.mutation(internal.searchlane.finishLane, {
      context: { laneId: firstId, searchId, userId },
      result: {
        kind: "success",
        returnValue: {
          inputTokens: 10,
          kind: "success",
          outputTokens: 5,
          resultCount: 1,
          threadId: "thread-1",
        },
      },
      workId: "work-1" as WorkId,
    });
    expect(
      await test.run((ctx) => ctx.db.get("searches", searchId))
    ).toMatchObject({ status: "running" });

    await test.mutation(internal.searchlane.finishLane, {
      context: { laneId: secondId, searchId, userId },
      result: {
        kind: "success",
        returnValue: {
          error: "Firecrawl has insufficient credits.",
          kind: "failed",
          limitation: "source_capacity",
        },
      },
      workId: "work-2" as WorkId,
    });
    expect(
      await test.run((ctx) => ctx.db.get("searches", searchId))
    ).toMatchObject({
      inputTokens: 10,
      limitation: "source_capacity",
      outcome: "partial",
      outputTokens: 5,
      status: "complete",
      threadId: "thread-1",
    });
    await test.mutation(internal.searchlane.finishLane, {
      context: { laneId: firstId, searchId, userId },
      result: { kind: "canceled" },
      workId: "work-repeat" as WorkId,
    });
    const lateLaneId = await test.run((ctx) =>
      ctx.db.insert("searchLanes", {
        market: "Late",
        searchId,
        status: "queued",
        updatedAt: 2,
        userId,
      })
    );
    await test.mutation(internal.searchlane.finishLane, {
      context: { laneId: lateLaneId, searchId, userId },
      result: { error: "Unexpected lane failure.", kind: "failed" },
      workId: "work-late" as WorkId,
    });
    expect(
      await test.run((ctx) => ctx.db.get("searchLanes", lateLaneId))
    ).toMatchObject({ status: "failed" });
  });

  it("fails empty searches and records target attainment", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) => ctx.db.insert("users", {}));
    const [emptyId, partialId, targetId] = await test.run(async (ctx) => {
      const empty = await ctx.db.insert("searches", {
        createdAt: 1,
        locale: "en",
        query: "empty",
        status: "running",
        userId,
      });
      const partial = await ctx.db.insert("searches", {
        createdAt: 3,
        locale: "en",
        query: "partial",
        resultCount: 1,
        stage: "expansion",
        status: "running",
        userId,
      });
      const target = await ctx.db.insert("searches", {
        createdAt: 4,
        locale: "en",
        query: "target",
        resultCount: 50,
        stage: "initial",
        status: "running",
        userId,
      });
      await ctx.db.insert("searchLanes", {
        market: "Target remainder",
        searchId: target,
        status: "running",
        updatedAt: 1,
        userId,
      });
      return [empty, partial, target] as const;
    });
    const [emptyLaneId, partialLaneId, targetLaneId] = await test.run(
      async (ctx) =>
        [
          await ctx.db.insert("searchLanes", {
            market: "Empty",
            searchId: emptyId,
            status: "queued",
            updatedAt: 1,
            userId,
          }),
          await ctx.db.insert("searchLanes", {
            market: "Partial",
            searchId: partialId,
            status: "queued",
            updatedAt: 1,
            userId,
          }),
          await ctx.db.insert("searchLanes", {
            market: "Target",
            searchId: targetId,
            status: "queued",
            updatedAt: 1,
            userId,
          }),
        ] as const
    );

    await test.mutation(internal.searchlane.finishLane, {
      context: { laneId: emptyLaneId, searchId: emptyId, userId },
      result: { kind: "canceled" },
      workId: "work-empty" as WorkId,
    });
    expect(
      await test.run((ctx) => ctx.db.get("searches", emptyId))
    ).toMatchObject({
      error: "No source-backed opportunities were found.",
      status: "failed",
    });

    await test.mutation(internal.searchlane.finishLane, {
      context: { laneId: partialLaneId, searchId: partialId, userId },
      result: { kind: "canceled" },
      workId: "work-partial" as WorkId,
    });
    expect(
      await test.run((ctx) => ctx.db.get("searches", partialId))
    ).toMatchObject({
      limitation: "source_exhausted",
      outcome: "partial",
      status: "complete",
    });

    await test.mutation(internal.searchlane.finishLane, {
      context: { laneId: targetLaneId, searchId: targetId, userId },
      result: {
        kind: "success",
        returnValue: {
          inputTokens: 1,
          kind: "success",
          outputTokens: 1,
          resultCount: 50,
          threadId: "target-thread",
        },
      },
      workId: "work-target" as WorkId,
    });
    expect(
      await test.run((ctx) => ctx.db.get("searches", targetId))
    ).toMatchObject({ outcome: "target_met", status: "complete" });
    expect(
      await test.run(async (ctx) =>
        (
          await ctx.db
            .query("searchLanes")
            .withIndex("by_search", (index) => index.eq("searchId", targetId))
            .collect()
        ).map((lane) => lane.status)
      )
    ).toEqual(["failed", "complete"]);
  });

  it("stops at typed capacity without inferring raw provider messages", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) => ctx.db.insert("users", {}));
    const [typedSearchId, rawSearchId] = await test.run(async (ctx) => [
      await ctx.db.insert("searches", {
        createdAt: 1,
        locale: "en",
        query: "typed capacity",
        status: "running",
        userId,
      }),
      await ctx.db.insert("searches", {
        createdAt: 2,
        locale: "en",
        query: "raw provider message",
        resultCount: 1,
        stage: "expansion",
        status: "running",
        userId,
      }),
    ]);
    const [typedLaneId, rawLaneId] = await test.run(async (ctx) => {
      const typed = await ctx.db.insert("searchLanes", {
        market: "Typed",
        searchId: typedSearchId,
        status: "queued",
        updatedAt: 1,
        userId,
      });
      await ctx.db.insert("searchLanes", {
        market: "Unknown raw failure",
        searchId: rawSearchId,
        status: "failed",
        updatedAt: 1,
        userId,
      });
      await ctx.db.insert("searchLanes", {
        error: "Firecrawl /v2/search failed: Rate limit exceeded",
        market: "Raw provider failure",
        searchId: rawSearchId,
        status: "failed",
        updatedAt: 1,
        userId,
      });
      await ctx.db.insert("searchLanes", {
        market: "Success without usage",
        searchId: rawSearchId,
        status: "complete",
        updatedAt: 1,
        userId,
      });
      const raw = await ctx.db.insert("searchLanes", {
        market: "Final completion",
        searchId: rawSearchId,
        status: "queued",
        updatedAt: 1,
        userId,
      });
      return [typed, raw] as const;
    });

    await test.mutation(internal.searchlane.finishLane, {
      context: { laneId: typedLaneId, searchId: typedSearchId, userId },
      result: {
        kind: "success",
        returnValue: {
          error: "Firecrawl has insufficient credits.",
          kind: "failed",
          limitation: "source_capacity",
        },
      },
      workId: "work-typed-capacity" as WorkId,
    });
    expect(
      await test.run((ctx) => ctx.db.get("searches", typedSearchId))
    ).toMatchObject({
      limitation: "source_capacity",
      status: "failed",
    });

    await test.mutation(internal.searchlane.finishLane, {
      context: { laneId: rawLaneId, searchId: rawSearchId, userId },
      result: { kind: "canceled" },
      workId: "work-raw-provider" as WorkId,
    });
    expect(
      await test.run((ctx) => ctx.db.get("searches", rawSearchId))
    ).toMatchObject({
      inputTokens: 0,
      limitation: "source_exhausted",
      outcome: "partial",
      outputTokens: 0,
      status: "complete",
      threadId: "",
    });
  });

  it("rejects lane completion across ownership boundaries", async () => {
    const test = convexTest(schema, modules);
    const ownerId = await test.run((ctx) => ctx.db.insert("users", {}));
    const otherId = await test.run((ctx) => ctx.db.insert("users", {}));
    const searchId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        createdAt: 1,
        locale: "en",
        query: "work",
        status: "running",
        userId: ownerId,
      })
    );
    const laneId = await test.run((ctx) =>
      ctx.db.insert("searchLanes", {
        market: "Germany",
        searchId,
        status: "queued",
        updatedAt: 1,
        userId: ownerId,
      })
    );

    await expect(
      test.mutation(internal.searchlane.finishLane, {
        context: { laneId, searchId, userId: otherId },
        result: { kind: "canceled" },
        workId: "work-wrong-user" as WorkId,
      })
    ).rejects.toThrow("SEARCH_LANE_MISMATCH");
  });
});
