/// <reference types="vite/client" />

import { describe, expect, it } from "@effect/vitest";
import { api, internal } from "@repo/backend/convex/_generated/api";
import schema from "@repo/backend/convex/schema";
import { convexTest } from "convex-test";

const modules = import.meta.glob("./**/*.ts");

/** Builds one valid profile input for Convex integration tests. */
function profileInput() {
  return {
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
}

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
    const input = profileInput();

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
    const input = profileInput();
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

  it("rejects domain-invalid profile values", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) => ctx.db.insert("users", {}));

    await expect(
      test.withIdentity({ subject: userId }).mutation(api.profiles.upsert, {
        ...profileInput(),
        experienceYears: -1,
      })
    ).rejects.toThrow("INVALID_PROFILE");
  });

  it("creates upload URLs only for authenticated users", async () => {
    const test = convexTest(schema, modules);
    await expect(test.mutation(api.profiles.uploadUrl, {})).rejects.toThrow(
      "UNAUTHENTICATED"
    );
    const userId = await test.run((ctx) => ctx.db.insert("users", {}));
    const url = await test
      .withIdentity({ subject: userId })
      .mutation(api.profiles.uploadUrl, {});

    expect(url).toContain("http");
  });

  it("validates CV storage metadata and requires a profile", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) => ctx.db.insert("users", {}));
    const missingId = await test.run((ctx) =>
      ctx.storage.store(new Blob(["deleted"], { type: "application/pdf" }))
    );
    await test.run((ctx) => ctx.storage.delete(missingId));
    const largeId = await test.run((ctx) =>
      ctx.storage.store(
        new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], {
          type: "application/pdf",
        })
      )
    );
    const pdfId = await test.run((ctx) =>
      ctx.storage.store(new Blob(["%PDF-1.4"], { type: "application/pdf" }))
    );

    await Promise.all(
      [missingId, largeId].map((fileId) =>
        expect(
          test.mutation(internal.profiles.saveCv, {
            fileId,
            fileName: "candidate.pdf",
            text: "Candidate",
            userId,
          })
        ).rejects.toThrow("INVALID_CV")
      )
    );
    await expect(
      test.mutation(internal.profiles.saveCv, {
        fileId: pdfId,
        fileName: "candidate.pdf",
        text: "Candidate",
        userId,
      })
    ).rejects.toThrow("PROFILE_REQUIRED");
  });

  it("replaces an owned CV and prevents cross-profile reuse", async () => {
    const test = convexTest(schema, modules);
    const [ownerId, otherId] = await test.run(async (ctx) => [
      await ctx.db.insert("users", {}),
      await ctx.db.insert("users", {}),
    ]);
    const ownerProfileId = await test
      .withIdentity({ subject: ownerId })
      .mutation(api.profiles.upsert, profileInput());
    await test
      .withIdentity({ subject: otherId })
      .mutation(api.profiles.upsert, profileInput());
    const [oldId, nextId] = await test.run(async (ctx) => [
      await ctx.storage.store(
        new Blob(["%PDF-1.4 old"], { type: "application/pdf" })
      ),
      await ctx.storage.store(
        new Blob(["%PDF-1.4 next"], { type: "application/pdf" })
      ),
    ]);
    await test.run((ctx) =>
      ctx.db.patch("profiles", ownerProfileId, { cvStorageId: oldId })
    );

    await test.mutation(internal.profiles.saveCv, {
      fileId: nextId,
      fileName: `${"c".repeat(170)}.pdf`,
      text: "Candidate CV",
      userId: ownerId,
    });
    const ownerProfile = await test.run((ctx) =>
      ctx.db.get("profiles", ownerProfileId)
    );
    expect(ownerProfile?.cvFileName).toHaveLength(160);
    expect(
      await test.run((ctx) => ctx.db.system.get("_storage", oldId))
    ).toBeNull();

    await test.mutation(internal.profiles.saveCv, {
      fileId: nextId,
      fileName: "candidate.pdf",
      text: "Candidate CV",
      userId: ownerId,
    });
    await expect(
      test.mutation(internal.profiles.saveCv, {
        fileId: nextId,
        fileName: "candidate.pdf",
        text: "Candidate CV",
        userId: otherId,
      })
    ).rejects.toThrow("CV_ALREADY_OWNED");
  });
});
