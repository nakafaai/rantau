/// <reference types="vite/client" />

import { describe, expect, it } from "@effect/vitest";
import { internal } from "@repo/backend/convex/_generated/api";
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

describe("search result storage", () => {
  it("expires only the owner's unfinished lanes and stays idempotent", async () => {
    const test = convexTest(schema, modules);
    const ownerId = await test.run((ctx) => ctx.db.insert("users", {}));
    const otherId = await test.run((ctx) => ctx.db.insert("users", {}));
    const missingId = await test.run(async (ctx) => {
      const id = await ctx.db.insert("searches", {
        createdAt: 1,
        locale: "en",
        query: "deleted",
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
        createdAt: 2,
        locale: "en",
        query: "deadline",
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
            updatedAt: 1,
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
      await test.run((ctx) => ctx.db.get("searches", searchId))
    ).toMatchObject({ status: "running" });

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
      await test.run((ctx) => ctx.db.get("searches", searchId))
    ).toMatchObject({ status: "failed" });
    expect(
      await test.mutation(internal.searches.expire, {
        searchId,
        userId: ownerId,
      })
    ).toBeNull();
  });

  it("keeps streamed results as a partial search at the deadline", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) => ctx.db.insert("users", {}));
    const searchId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        createdAt: 1,
        locale: "en",
        query: "nurse",
        resultCount: 7,
        stage: "expansion",
        status: "running",
        userId,
      })
    );
    await test.run((ctx) =>
      ctx.db.insert("searchLanes", {
        market: "Germany",
        searchId,
        status: "running",
        updatedAt: 1,
        userId,
      })
    );

    await test.mutation(internal.searches.expire, { searchId, userId });

    expect(
      await test.run((ctx) => ctx.db.get("searches", searchId))
    ).toMatchObject({
      limitation: "deadline",
      outcome: "partial",
      resultCount: 7,
      status: "complete",
    });
  });

  it("streams unique opportunities inside the shared result budget", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) => ctx.db.insert("users", {}));
    const searchId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        createdAt: 1,
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
        createdAt: 2,
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
      if (record) {
        await ctx.db.patch("opportunities", record._id, {
          fingerprint: undefined,
        });
      }
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
});
