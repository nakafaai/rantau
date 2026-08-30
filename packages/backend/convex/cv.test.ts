/// <reference types="vite/client" />

import { api } from "@repo/backend/convex/_generated/api";
import schema from "@repo/backend/convex/schema";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

const modules = import.meta.glob("./**/*.ts");

describe("CV intake", () => {
  it("discards an uploaded file when extraction fails", async () => {
    const test = convexTest(schema, modules);
    const userId = await test.run((ctx) =>
      ctx.db.insert("users", { email: "candidate@example.com" })
    );
    const authenticated = test.withIdentity({ subject: userId });
    await authenticated.mutation(api.profiles.upsert, {
      desiredLocations: ["Germany"],
      desiredRoles: ["Nurse"],
      documents: ["Passport"],
      education: ["Nursing diploma"],
      experienceYears: 2,
      languages: [{ language: "German", level: "B1" }],
      licenses: [],
      locale: "en",
      pathways: ["ausbildung"],
      skills: ["Patient care"],
      workModes: ["onsite"],
    });
    const fileId = await test.run((ctx) =>
      ctx.storage.store(
        new Blob(["not a valid PDF"], { type: "application/pdf" })
      )
    );

    await expect(
      authenticated.action(api.cv.extract, {
        fileId,
        fileName: "candidate.pdf",
      })
    ).rejects.toBeDefined();

    const metadata = await test.run((ctx) =>
      ctx.db.system.get("_storage", fileId)
    );
    expect(metadata).toBeNull();
  });
});
