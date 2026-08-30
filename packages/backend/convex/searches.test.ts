/// <reference types="vite/client" />

import type { WorkId } from "@convex-dev/workpool";
import { describe, expect, it } from "@effect/vitest";
import { api, internal } from "@repo/backend/convex/_generated/api";
import schema from "@repo/backend/convex/schema";
import { convexTest } from "convex-test";

const modules = import.meta.glob("./**/*.ts");

/** Creates one source-backed opportunity fixture at a distinct direct URL. */
function opportunity(path = "nurse") {
  return {
    applicationSteps: ["Apply online"],
    company: "Example Health",
    country: "Germany",
    countryCode: "DE",
    deadline: null,
    directApplyUrl: `https://example.com/jobs/${path}`,
    employmentType: "Full-time",
    location: "Berlin, Germany",
    pathway: "job" as const,
    publishedAt: null,
    requirements: [],
    salary: null,
    source: {
      kind: "employer" as const,
      name: "Example Health",
      retrievedAt: "2026-08-30T00:00:00.000Z",
      url: `https://example.com/jobs/${path}`,
    },
    summary: "Direct nursing opportunity.",
    support: [],
    title: "Nurse",
    workMode: "onsite" as const,
  };
}

describe("durable searches", () => {
  it("exposes durable sessions only to the owner", async () => {
    const test = convexTest(schema, modules);
    const ownerId = await test.run((ctx) =>
      ctx.db.insert("users", { email: "owner@example.com" })
    );
    const otherId = await test.run((ctx) =>
      ctx.db.insert("users", { email: "other@example.com" })
    );
    const searchId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        createdAt: Date.now(),
        locale: "en",
        query: "nursing",
        resultCount: 0,
        status: "running",
        userId: ownerId,
      })
    );
    const owner = test.withIdentity({ subject: ownerId });
    const other = test.withIdentity({ subject: otherId });

    expect((await owner.query(api.searches.get, { searchId }))?.status).toBe(
      "running"
    );
    expect((await owner.query(api.searches.latest, {}))?.status).toBe(
      "running"
    );
    expect(await other.query(api.searches.get, { searchId })).toBeNull();
    expect(await other.query(api.searches.latest, {})).toBeNull();

    await test.run((ctx) =>
      ctx.db.patch("searches", searchId, { status: "complete" })
    );
    expect((await owner.query(api.searches.latest, {}))?.status).toBe(
      "complete"
    );
  });

  it("expires only the owner's unfinished lanes and stays idempotent", async () => {
    const test = convexTest(schema, modules);
    const ownerId = await test.run((ctx) => ctx.db.insert("users", {}));
    const otherId = await test.run((ctx) => ctx.db.insert("users", {}));
    const missingId = await test.run(async (ctx) => {
      const id = await ctx.db.insert("searches", {
        createdAt: Date.now(),
        locale: "en",
        query: "deleted",
        resultCount: 0,
        status: "running",
        userId: ownerId,
      });
      await ctx.db.delete("searches", id);
      return id;
    });
    expect(
      await test.mutation(internal.searches.expire, {
        searchId: missingId,
        userId: ownerId,
      })
    ).toBeNull();

    const searchId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        createdAt: Date.now(),
        locale: "en",
        query: "deadline",
        resultCount: 0,
        status: "running",
        userId: ownerId,
      })
    );
    const lanes = await test.run(async (ctx) =>
      Promise.all(
        (["queued", "running", "complete"] as const).map((status) =>
          ctx.db.insert("searchLanes", {
            market: status,
            searchId,
            status,
            updatedAt: Date.now(),
            userId: ownerId,
          })
        )
      )
    );
    expect(
      await test.mutation(internal.searches.expire, {
        searchId,
        userId: otherId,
      })
    ).toBeNull();
    expect(
      (
        await test
          .withIdentity({ subject: ownerId })
          .query(api.searches.get, { searchId })
      )?.status
    ).toBe("running");

    await test.mutation(internal.searches.expire, {
      searchId,
      userId: ownerId,
    });
    const settled = await test.run((ctx) =>
      Promise.all(lanes.map((laneId) => ctx.db.get("searchLanes", laneId)))
    );
    expect(settled.map((lane) => lane?.status)).toEqual([
      "failed",
      "failed",
      "complete",
    ]);
    expect(
      (
        await test
          .withIdentity({ subject: ownerId })
          .query(api.searches.get, { searchId })
      )?.status
    ).toBe("failed");
    expect(
      await test.mutation(internal.searches.expire, {
        searchId,
        userId: ownerId,
      })
    ).toBeNull();

    const lateLaneId = await test.run((ctx) =>
      ctx.db.insert("searchLanes", {
        market: "late",
        searchId,
        status: "queued",
        updatedAt: Date.now(),
        userId: ownerId,
      })
    );
    await test.mutation(internal.searches.finishLane, {
      context: { laneId: lateLaneId, searchId, userId: ownerId },
      result: { kind: "canceled" },
      workId: "work-late" as WorkId,
    });
    expect(
      await test.run((ctx) => ctx.db.get("searchLanes", lateLaneId))
    ).toMatchObject({ status: "failed" });
  });

  it("streams unique opportunities inside the shared result budget", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) =>
      ctx.db.insert("users", { email: "stream@example.com" })
    );
    const searchId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        createdAt: Date.now(),
        locale: "en",
        query: "nurse",
        resultCount: 0,
        status: "running",
        userId,
      })
    );

    expect(
      await test.mutation(internal.searches.append, {
        opportunity: opportunity(),
        searchId,
        userId,
      })
    ).toBe(true);
    expect(
      await test.mutation(internal.searches.append, {
        opportunity: opportunity(),
        searchId,
        userId,
      })
    ).toBe(false);
    const legacyId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        createdAt: Date.now(),
        locale: "en",
        query: "legacy",
        status: "running",
        userId,
      })
    );
    expect(
      await test.mutation(internal.searches.append, {
        opportunity: opportunity("legacy"),
        searchId: legacyId,
        userId,
      })
    ).toBe(true);
    await test.run(async (ctx) => {
      const record = await ctx.db
        .query("opportunities")
        .withIndex("by_search", (index) => index.eq("searchId", legacyId))
        .unique();
      if (record === null) {
        throw new Error("Expected the legacy opportunity fixture to exist");
      }
      await ctx.db.patch("opportunities", record._id, {
        fingerprint: undefined,
      });
    });
    expect(
      await test.mutation(internal.searches.append, {
        opportunity: opportunity("legacy"),
        searchId: legacyId,
        userId,
      })
    ).toBe(false);
    const otherId = await test.run((ctx) => ctx.db.insert("users", {}));
    await expect(
      test.mutation(internal.searches.append, {
        opportunity: opportunity("wrong-user"),
        searchId,
        userId: otherId,
      })
    ).rejects.toThrow("SEARCH_SESSION_MISMATCH");
    await test.run((ctx) =>
      ctx.db.patch("searches", searchId, { status: "complete" })
    );
    await expect(
      test.mutation(internal.searches.append, {
        opportunity: opportunity("complete"),
        searchId,
        userId,
      })
    ).rejects.toThrow("SEARCH_SESSION_MISMATCH");
    await test.run((ctx) =>
      ctx.db.patch("searches", searchId, {
        resultCount: 100,
        status: "running",
      })
    );
    expect(
      await test.mutation(internal.searches.append, {
        opportunity: opportunity("doctor"),
        searchId,
        userId,
      })
    ).toBe(false);
  });

  it("reduces successful and failed lanes into one complete search", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) =>
      ctx.db.insert("users", { email: "candidate@example.com" })
    );
    const searchId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        createdAt: Date.now(),
        locale: "id",
        query: "dokter",
        resultCount: 1,
        status: "running",
        userId,
      })
    );
    const [germanyId, indonesiaId] = await test.run(async (ctx) => {
      const germany = await ctx.db.insert("searchLanes", {
        market: "Germany",
        searchId,
        status: "queued",
        updatedAt: Date.now(),
        userId,
      });
      const indonesia = await ctx.db.insert("searchLanes", {
        market: "Indonesia",
        searchId,
        status: "queued",
        updatedAt: Date.now(),
        userId,
      });
      await ctx.db.insert("searchLanes", {
        market: "Legacy complete lane",
        searchId,
        status: "complete",
        updatedAt: Date.now(),
        userId,
      });
      return [germany, indonesia] as const;
    });

    await test.mutation(internal.searches.markLaneRunning, {
      laneId: germanyId,
      searchId,
      userId,
    });
    await test.mutation(internal.searches.finishLane, {
      context: { laneId: germanyId, searchId, userId },
      result: {
        kind: "success",
        returnValue: {
          inputTokens: 10,
          outputTokens: 5,
          resultCount: 1,
          threadId: "thread-1",
        },
      },
      workId: "work-1" as WorkId,
    });
    expect(
      (
        await test
          .withIdentity({ subject: userId })
          .query(api.searches.get, { searchId })
      )?.status
    ).toBe("running");

    await test.mutation(internal.searches.finishLane, {
      context: { laneId: indonesiaId, searchId, userId },
      result: { error: "Provider unavailable", kind: "failed" },
      workId: "work-2" as WorkId,
    });
    const completed = await test
      .withIdentity({ subject: userId })
      .query(api.searches.get, { searchId });
    expect(completed?.status).toBe("complete");
    expect(completed?.inputTokens).toBe(10);
    expect(completed?.outputTokens).toBe(5);
    expect(completed?.threadId).toBe("thread-1");
    await test.mutation(internal.searches.finishLane, {
      context: { laneId: germanyId, searchId, userId },
      result: { kind: "canceled" },
      workId: "work-repeat" as WorkId,
    });
  });

  it("fails a search after every lane settles without a result", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) =>
      ctx.db.insert("users", { email: "empty@example.com" })
    );
    const searchId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        createdAt: Date.now(),
        locale: "en",
        query: "work",
        resultCount: 0,
        status: "running",
        userId,
      })
    );
    const laneId = await test.run((ctx) =>
      ctx.db.insert("searchLanes", {
        market: "Germany",
        searchId,
        status: "queued",
        updatedAt: Date.now(),
        userId,
      })
    );

    await test.mutation(internal.searches.finishLane, {
      context: { laneId, searchId, userId },
      result: { kind: "canceled" },
      workId: "work-empty" as WorkId,
    });
    const failed = await test
      .withIdentity({ subject: userId })
      .query(api.searches.get, { searchId });
    expect(failed?.status).toBe("failed");
    expect(failed?.error).toBe("No source-backed opportunities were found.");
  });

  it("rejects a lane update from a different user", async () => {
    const test = convexTest(schema, modules);
    const ownerId = await test.run((ctx) => ctx.db.insert("users", {}));
    const otherId = await test.run((ctx) => ctx.db.insert("users", {}));
    const searchId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        createdAt: Date.now(),
        locale: "en",
        query: "work",
        resultCount: 0,
        status: "running",
        userId: ownerId,
      })
    );
    const laneId = await test.run((ctx) =>
      ctx.db.insert("searchLanes", {
        market: "Germany",
        searchId,
        status: "queued",
        updatedAt: Date.now(),
        userId: ownerId,
      })
    );

    await expect(
      test.mutation(internal.searches.markLaneRunning, {
        laneId,
        searchId,
        userId: otherId,
      })
    ).rejects.toThrow("SEARCH_LANE_MISMATCH");
    await test.mutation(internal.searches.markLaneRunning, {
      laneId,
      searchId,
      userId: ownerId,
    });
    await test.mutation(internal.searches.markLaneRunning, {
      laneId,
      searchId,
      userId: ownerId,
    });
    await expect(
      test.mutation(internal.searches.finishLane, {
        context: { laneId, searchId, userId: otherId },
        result: { kind: "canceled" },
        workId: "work-wrong-user" as WorkId,
      })
    ).rejects.toThrow("SEARCH_LANE_MISMATCH");
  });
});
