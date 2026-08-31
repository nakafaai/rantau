/// <reference types="vite/client" />

import { describe, expect, it } from "@effect/vitest";
import { internal } from "@repo/backend/convex/_generated/api";
import schema from "@repo/backend/convex/schema";
import { convexTest } from "convex-test";

const modules = import.meta.glob("./**/*.ts");

describe("search lane input", () => {
  it("loads the matching lane and immutable city intent", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) => ctx.db.insert("users", {}));
    const searchId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        city: "Munich",
        country: "Germany",
        countryCode: "DE",
        createdAt: Date.now(),
        locale: "en",
        pathway: "job",
        query: "doctor",
        region: "Bavaria",
        regionCode: "BY",
        stage: "initial",
        status: "running",
        userId,
        workMode: "onsite",
      })
    );
    const laneId = await test.run((ctx) =>
      ctx.db.insert("searchLanes", {
        limit: 20,
        market: "Munich, Bavaria, Germany",
        searchId,
        sourceQuery: "doctor Munich hiring",
        status: "queued",
        updatedAt: Date.now(),
        userId,
      })
    );

    await expect(
      test.query(internal.searchinput.laneInput, { laneId, searchId, userId })
    ).resolves.toEqual({
      limit: 20,
      locale: "en",
      market: "Munich, Bavaria, Germany",
      pathway: "job",
      place: {
        city: "Munich",
        country: "Germany",
        countryCode: "DE",
        level: "city",
        region: "Bavaria",
        regionCode: "BY",
      },
      query: "doctor",
      sourceQuery: "doctor Munich hiring",
      workMode: "onsite",
    });
  });

  it("rejects every mismatched or incomplete lane shape", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) => ctx.db.insert("users", {}));
    const otherId = await test.run((ctx) => ctx.db.insert("users", {}));
    const [searchId, otherSearchId] = await test.run(async (ctx) => [
      await ctx.db.insert("searches", {
        createdAt: 1,
        locale: "en",
        query: "doctor",
        status: "running",
        userId,
      }),
      await ctx.db.insert("searches", {
        createdAt: 2,
        locale: "en",
        query: "nurse",
        status: "running",
        userId: otherId,
      }),
    ]);
    const deletedLaneId = await test.run(async (ctx) => {
      const id = await ctx.db.insert("searchLanes", {
        limit: 20,
        market: "deleted",
        searchId,
        sourceQuery: "deleted",
        status: "queued",
        updatedAt: 1,
        userId,
      });
      await ctx.db.delete("searchLanes", id);
      return id;
    });
    const deletedSearchId = await test.run(async (ctx) => {
      const id = await ctx.db.insert("searches", {
        createdAt: 3,
        locale: "en",
        query: "deleted",
        status: "running",
        userId,
      });
      await ctx.db.delete("searches", id);
      return id;
    });
    const lanes = await test.run(async (ctx) => ({
      foreignSearch: await ctx.db.insert("searchLanes", {
        limit: 20,
        market: "foreign search",
        searchId: otherSearchId,
        sourceQuery: "doctor",
        status: "queued",
        updatedAt: 1,
        userId,
      }),
      foreignUser: await ctx.db.insert("searchLanes", {
        limit: 20,
        market: "foreign user",
        searchId,
        sourceQuery: "doctor",
        status: "queued",
        updatedAt: 1,
        userId: otherId,
      }),
      missingLimit: await ctx.db.insert("searchLanes", {
        market: "missing limit",
        searchId,
        sourceQuery: "doctor",
        status: "queued",
        updatedAt: 1,
        userId,
      }),
      missingQuery: await ctx.db.insert("searchLanes", {
        limit: 20,
        market: "missing query",
        searchId,
        status: "queued",
        updatedAt: 1,
        userId,
      }),
      otherOwner: await ctx.db.insert("searchLanes", {
        limit: 20,
        market: "other owner",
        searchId: otherSearchId,
        sourceQuery: "doctor",
        status: "queued",
        updatedAt: 1,
        userId: otherId,
      }),
      terminal: await ctx.db.insert("searchLanes", {
        limit: 20,
        market: "terminal",
        searchId,
        sourceQuery: "doctor",
        status: "failed",
        updatedAt: 1,
        userId,
      }),
      valid: await ctx.db.insert("searchLanes", {
        limit: 20,
        market: "valid",
        searchId,
        sourceQuery: "doctor",
        status: "queued",
        updatedAt: 1,
        userId,
      }),
    }));
    const invalid = [
      { laneId: deletedLaneId, searchId, userId },
      { laneId: lanes.valid, searchId: deletedSearchId, userId },
      { laneId: lanes.foreignSearch, searchId, userId },
      { laneId: lanes.foreignUser, searchId, userId },
      { laneId: lanes.otherOwner, searchId: otherSearchId, userId },
      { laneId: lanes.missingLimit, searchId, userId },
      { laneId: lanes.missingQuery, searchId, userId },
      { laneId: lanes.terminal, searchId, userId },
    ];

    await Promise.all(
      invalid.map((args) =>
        expect(
          test.query(internal.searchinput.laneInput, args)
        ).rejects.toThrow("SEARCH_LANE_MISMATCH")
      )
    );
  });

  it("marks an owned queued lane once", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) => ctx.db.insert("users", {}));
    const otherId = await test.run((ctx) => ctx.db.insert("users", {}));
    const searchId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        createdAt: 1,
        locale: "en",
        query: "work",
        status: "running",
        userId,
      })
    );
    const laneId = await test.run((ctx) =>
      ctx.db.insert("searchLanes", {
        market: "Germany",
        searchId,
        status: "queued",
        updatedAt: 1,
        userId,
      })
    );

    await test.mutation(internal.searchinput.markLaneRunning, {
      laneId,
      searchId,
      userId,
    });
    await test.mutation(internal.searchinput.markLaneRunning, {
      laneId,
      searchId,
      userId,
    });
    expect(
      await test.run((ctx) => ctx.db.get("searchLanes", laneId))
    ).toMatchObject({ status: "running" });
    await expect(
      test.mutation(internal.searchinput.markLaneRunning, {
        laneId,
        searchId,
        userId: otherId,
      })
    ).rejects.toThrow("SEARCH_LANE_MISMATCH");
  });
});
