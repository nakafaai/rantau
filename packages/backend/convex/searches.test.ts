/// <reference types="vite/client" />

import { api, internal } from "@repo/backend/convex/_generated/api";
import schema from "@repo/backend/convex/schema";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

const modules = import.meta.glob("./**/*.ts");

describe("durable searches", () => {
  it("exposes lifecycle changes only to the owning user", async () => {
    const test = convexTest(schema, modules);
    const ownerId = await test.run((ctx) =>
      ctx.db.insert("users", { email: "owner@example.com" })
    );
    const otherId = await test.run((ctx) =>
      ctx.db.insert("users", { email: "other@example.com" })
    );
    const searchId = await test.mutation(internal.searches.start, {
      country: "Germany",
      locale: "en",
      pathway: "ausbildung",
      query: "nursing",
      userId: ownerId,
      workMode: "onsite",
    });
    const owner = test.withIdentity({ subject: ownerId });
    const other = test.withIdentity({ subject: otherId });

    expect((await owner.query(api.searches.get, { searchId }))?.status).toBe(
      "running"
    );
    expect(await other.query(api.searches.get, { searchId })).toBeNull();

    await test.mutation(internal.searches.complete, {
      model: "test-model",
      opportunities: [],
      searchId,
      threadId: "test-thread",
      userId: ownerId,
    });

    const completed = await owner.query(api.searches.latest, {});
    expect(completed?.status).toBe("complete");
    expect(completed?.resultCount).toBe(0);
  });

  it("persists a safe terminal failure state", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) =>
      ctx.db.insert("users", { email: "candidate@example.com" })
    );
    const searchId = await test.mutation(internal.searches.start, {
      locale: "id",
      query: "dokter",
      userId,
    });

    await test.mutation(internal.searches.fail, {
      error: "Search unavailable",
      searchId,
      userId,
    });

    const failed = await test
      .withIdentity({ subject: userId })
      .query(api.searches.get, { searchId });
    expect(failed?.status).toBe("failed");
    expect(failed?.error).toBe("Search unavailable");
  });

  it("rejects a lifecycle update from a different user", async () => {
    const test = convexTest(schema, modules);
    const ownerId = await test.run((ctx) =>
      ctx.db.insert("users", { email: "owner@example.com" })
    );
    const otherId = await test.run((ctx) =>
      ctx.db.insert("users", { email: "other@example.com" })
    );
    const searchId = await test.mutation(internal.searches.start, {
      locale: "en",
      query: "work",
      userId: ownerId,
    });

    await expect(
      test.mutation(internal.searches.fail, {
        error: "Search unavailable",
        searchId,
        userId: otherId,
      })
    ).rejects.toThrow("SEARCH_SESSION_MISMATCH");
  });
});
