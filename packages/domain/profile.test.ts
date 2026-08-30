import { ProfileInput } from "@repo/domain/profile";
import { Schema } from "effect";
import { describe, expect, it } from "vitest";

describe("candidate profile", () => {
  it("accepts a bounded personalization profile", () => {
    const profile = Schema.decodeUnknownSync(ProfileInput)({
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

    expect(profile.pathways).toEqual(["ausbildung"]);
  });
});
