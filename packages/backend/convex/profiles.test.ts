/// <reference types="vite/client" />

import { api, internal } from "@repo/backend/convex/_generated/api";
import schema from "@repo/backend/convex/schema";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

const modules = import.meta.glob("./**/*.ts");

describe("candidate profiles", () => {
  it("rejects anonymous profile access", async () => {
    const test = convexTest(schema, modules);

    await expect(test.query(api.profiles.get, {})).rejects.toBeDefined();
  });

  it("stores one profile per authenticated user", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) =>
      ctx.db.insert("users", { email: "candidate@example.com" })
    );
    const authenticated = test.withIdentity({ subject: userId });
    const input = {
      desiredLocations: ["Germany"],
      desiredRoles: ["Nurse"],
      documents: ["Passport"],
      education: ["Nursing diploma"],
      experienceYears: 2,
      languages: [{ language: "German", level: "B1" }],
      licenses: [],
      locale: "en" as const,
      pathways: ["ausbildung" as const],
      skills: ["Patient care"],
      workModes: ["onsite" as const],
    };

    const profileId = await authenticated.mutation(api.profiles.upsert, input);
    const updatedId = await authenticated.mutation(api.profiles.upsert, {
      ...input,
      experienceYears: 3,
    });
    const profile = await authenticated.query(api.profiles.get, {});

    expect(updatedId).toBe(profileId);
    expect(profile?.experienceYears).toBe(3);
  });

  it("protects referenced CV files and discards orphaned uploads", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) =>
      ctx.db.insert("users", { email: "candidate@example.com" })
    );
    const input = {
      desiredLocations: ["Germany"],
      desiredRoles: ["Nurse"],
      documents: ["Passport"],
      education: ["Nursing diploma"],
      experienceYears: 2,
      languages: [{ language: "German", level: "B1" }],
      licenses: [],
      locale: "en" as const,
      pathways: ["ausbildung" as const],
      skills: ["Patient care"],
      workModes: ["onsite" as const],
    };
    const profileId = await test
      .withIdentity({ subject: userId })
      .mutation(api.profiles.upsert, input);

    const referencedId = await test.run((ctx) =>
      ctx.storage.store(
        new Blob(["%PDF-1.4 referenced"], { type: "application/pdf" })
      )
    );
    await test.run((ctx) =>
      ctx.db.patch("profiles", profileId, {
        cvFileName: "candidate.pdf",
        cvStorageId: referencedId,
        cvText: "Candidate CV",
      })
    );
    await test.mutation(internal.profiles.discardCv, {
      fileId: referencedId,
    });
    const referenced = await test.run((ctx) =>
      ctx.db.system.get("_storage", referencedId)
    );
    expect(referenced).not.toBeNull();

    const orphanId = await test.run((ctx) =>
      ctx.storage.store(
        new Blob(["%PDF-1.4 orphan"], { type: "application/pdf" })
      )
    );
    await test.mutation(internal.profiles.discardCv, { fileId: orphanId });
    const orphan = await test.run((ctx) =>
      ctx.db.system.get("_storage", orphanId)
    );
    expect(orphan).toBeNull();
  });
});
