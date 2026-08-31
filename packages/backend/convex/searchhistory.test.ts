/// <reference types="vite/client" />

import { describe, expect, it } from "@effect/vitest";
import { api } from "@repo/backend/convex/_generated/api";
import schema from "@repo/backend/convex/schema";
import { convexTest } from "convex-test";

const modules = import.meta.glob("./**/*.ts");

describe("search history", () => {
  it("exposes durable sessions only to their owner", async () => {
    const test = convexTest(schema, modules);
    const ownerId = await test.run((ctx) => ctx.db.insert("users", {}));
    const otherId = await test.run((ctx) => ctx.db.insert("users", {}));
    const searchId = await test.run((ctx) =>
      ctx.db.insert("searches", {
        createdAt: 1,
        locale: "en",
        query: "nursing",
        status: "running",
        userId: ownerId,
      })
    );
    const owner = test.withIdentity({ subject: ownerId });
    const other = test.withIdentity({ subject: otherId });

    expect(
      (await owner.query(api.searchhistory.get, { searchId }))?.status
    ).toBe("running");
    expect((await owner.query(api.searchhistory.latest, {}))?._id).toBe(
      searchId
    );
    expect(await other.query(api.searchhistory.get, { searchId })).toBeNull();
    expect(await other.query(api.searchhistory.latest, {})).toBeNull();
  });

  it("normalizes route keys and paginates newest owner sessions", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) => ctx.db.insert("users", {}));
    const otherId = await test.run((ctx) => ctx.db.insert("users", {}));
    const [olderId, newestId, otherSearchId] = await test.run(async (ctx) => {
      const older = await ctx.db.insert("searches", {
        createdAt: 1,
        locale: "en",
        query: "older",
        resultCount: 1,
        status: "complete",
        userId,
      });
      const newest = await ctx.db.insert("searches", {
        createdAt: 2,
        locale: "en",
        outcome: "target_met",
        query: "newest",
        resultCount: 50,
        status: "complete",
        userId,
      });
      const other = await ctx.db.insert("searches", {
        createdAt: 3,
        locale: "en",
        query: "private",
        status: "complete",
        userId: otherId,
      });
      return [older, newest, other] as const;
    });
    const owner = test.withIdentity({ subject: userId });

    expect(
      await owner.query(api.searchhistory.byKey, { searchKey: "invalid" })
    ).toBeNull();
    expect(
      (await owner.query(api.searchhistory.byKey, { searchKey: newestId }))
        ?.outcome
    ).toBe("target_met");
    expect(
      await owner.query(api.searchhistory.byKey, {
        searchKey: otherSearchId,
      })
    ).toBeNull();

    const first = await owner.query(api.searchhistory.history, {
      paginationOpts: { cursor: null, numItems: 1 },
    });
    expect(first.page.map((search) => search._id)).toEqual([newestId]);
    expect(first.isDone).toBe(false);
    const second = await owner.query(api.searchhistory.history, {
      paginationOpts: { cursor: first.continueCursor, numItems: 1 },
    });
    expect(second.page.map((search) => search._id)).toEqual([olderId]);
    expect(second.isDone).toBe(true);
  });
});
