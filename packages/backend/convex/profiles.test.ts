/// <reference types="vite/client" />

import { api } from "@repo/backend/convex/_generated/api";
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
});
