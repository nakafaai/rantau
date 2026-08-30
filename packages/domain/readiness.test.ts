import { buildReadinessPlan, readinessPercent } from "@repo/domain/readiness";
import { describe, expect, it } from "vitest";

const requirements = [
  { category: "language" as const, description: "German B1", required: true },
  { category: "document" as const, description: "Passport", required: true },
];

describe("readiness plan", () => {
  it("marks unknown requirements for verification", () => {
    const plan = buildReadinessPlan(null, requirements);
    expect(plan.map(({ status }) => status)).toEqual(["verify", "verify"]);
    expect(readinessPercent(plan)).toBe(0);
  });

  it("compares requirements with the candidate profile", () => {
    const plan = buildReadinessPlan(
      {
        documents: ["Passport"],
        education: [],
        experienceYears: 0,
        languages: [{ language: "German", level: "B1" }],
        licenses: [],
        skills: [],
      },
      requirements
    );
    expect(plan.map(({ status }) => status)).toEqual(["ready", "ready"]);
    expect(readinessPercent(plan)).toBe(100);
  });

  it("returns full readiness when no requirements exist", () => {
    expect(readinessPercent([])).toBe(100);
  });

  it("checks every profile-owned requirement category", () => {
    const plan = buildReadinessPlan(
      {
        documents: ["passport"],
        education: ["diploma"],
        experienceYears: 2,
        languages: [{ language: "Japanese", level: "N4" }],
        licenses: ["nursing license"],
        skills: ["welding"],
      },
      [
        { category: "document", description: "Passport", required: true },
        { category: "education", description: "Diploma", required: true },
        { category: "language", description: "Japanese N4", required: true },
        { category: "license", description: "Nursing license", required: true },
        { category: "skill", description: "Welding", required: true },
        { category: "experience", description: "Two years", required: true },
      ]
    );

    expect(plan.map(({ status }) => status)).toEqual([
      "ready",
      "ready",
      "ready",
      "ready",
      "ready",
      "prepare",
    ]);
    expect(readinessPercent(plan)).toBe(83);
  });
});
