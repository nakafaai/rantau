/// <reference types="vite/client" />

import { describe, expect, it } from "@effect/vitest";
import { api } from "@repo/backend/convex/_generated/api";
import schema from "@repo/backend/convex/schema";
import { convexTest } from "convex-test";

const modules = import.meta.glob("./**/*.ts");

/** Creates one source-backed opportunity fixture for application tests. */
function opportunity() {
  return {
    applicationSteps: ["Apply online"],
    company: "Example Health",
    country: "Germany",
    countryCode: "DE",
    deadline: null,
    directApplyUrl: "https://example.com/jobs/nurse",
    employmentType: "Full-time",
    location: "Berlin, Germany",
    pathway: "job" as const,
    publishedAt: null,
    requirements: [],
    salary: null,
    source: {
      kind: "employer" as const,
      name: "Example Health",
      retrievedAt: "2026-08-31T00:00:00.000Z",
      url: "https://example.com/jobs/nurse",
    },
    summary: "Direct nursing opportunity.",
    support: [],
    title: "Nurse",
    workMode: "onsite" as const,
  };
}

describe("candidate applications", () => {
  it("deletes only an application owned by the authenticated user", async () => {
    const test = convexTest(schema, modules);
    const [ownerId, otherId] = await test.run(async (ctx) => [
      await ctx.db.insert("users", { email: "owner@example.com" }),
      await ctx.db.insert("users", { email: "other@example.com" }),
    ]);
    const applicationId = await test.run(async (ctx) => {
      const searchId = await ctx.db.insert("searches", {
        createdAt: Date.now(),
        locale: "en",
        query: "nurse",
        status: "complete",
        userId: ownerId,
      });
      const opportunityId = await ctx.db.insert("opportunities", {
        opportunity: opportunity(),
        searchId,
        userId: ownerId,
      });
      return ctx.db.insert("applications", {
        notes: "Saved for later",
        opportunityId,
        status: "saved",
        updatedAt: Date.now(),
        userId: ownerId,
      });
    });

    await expect(
      test.mutation(api.applications.remove, { applicationId })
    ).rejects.toThrow("UNAUTHENTICATED");
    await expect(
      test
        .withIdentity({ subject: otherId })
        .mutation(api.applications.remove, { applicationId })
    ).rejects.toThrow("NOT_FOUND");
    expect(
      await test.run((ctx) => ctx.db.get("applications", applicationId))
    ).not.toBeNull();

    await expect(
      test
        .withIdentity({ subject: ownerId })
        .mutation(api.applications.remove, { applicationId })
    ).resolves.toBeNull();
    expect(
      await test.run((ctx) => ctx.db.get("applications", applicationId))
    ).toBeNull();
  });
});
