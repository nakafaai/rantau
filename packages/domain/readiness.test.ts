import { buildReadinessPlan, readinessCounts } from "@repo/domain/readiness";
import { describe, expect, it } from "vitest";

const requirements = [
  { category: "language" as const, description: "German B1", required: true },
  { category: "document" as const, description: "Passport", required: true },
];

describe("readiness plan", () => {
  it("marks unknown requirements for verification", () => {
    const plan = buildReadinessPlan(null, requirements);
    expect(plan.map(({ status }) => status)).toEqual(["verify", "verify"]);
    expect(readinessCounts(plan)).toEqual({ ready: 0, total: 2 });
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
    expect(readinessCounts(plan)).toEqual({ ready: 2, total: 2 });
  });

  it("does not invent readiness when requirements are absent", () => {
    expect(readinessCounts([])).toEqual({ ready: 0, total: 0 });
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
    expect(readinessCounts(plan)).toEqual({ ready: 5, total: 6 });
  });

  it("does not satisfy a higher CEFR requirement with a lower level", () => {
    const [step] = buildReadinessPlan(
      {
        documents: [],
        education: [],
        experienceYears: 0,
        languages: [{ language: "German", level: "A1" }],
        licenses: [],
        skills: [],
      },
      [{ category: "language", description: "German B2", required: true }]
    );
    expect(step?.status).toBe("prepare");
  });

  it("requires the stated language even when another level matches", () => {
    const [step] = buildReadinessPlan(
      {
        documents: [],
        education: [],
        experienceYears: 0,
        languages: [{ language: "English", level: "B2" }],
        licenses: [],
        skills: [],
      },
      [{ category: "language", description: "German B2", required: true }]
    );
    expect(step?.status).toBe("prepare");
  });

  it("accepts a named language when no comparable level is stated", () => {
    const [step] = buildReadinessPlan(
      {
        documents: [],
        education: [],
        experienceYears: 0,
        languages: [{ language: "Japanese", level: "N4" }],
        licenses: [],
        skills: [],
      },
      [{ category: "language", description: "Japanese", required: true }]
    );
    expect(step?.status).toBe("ready");
  });

  it("compares numeric experience requirements", () => {
    const plan = buildReadinessPlan(
      {
        documents: [],
        education: [],
        experienceYears: 3,
        languages: [],
        licenses: [],
        skills: [],
      },
      [
        {
          category: "experience",
          description: "At least 2 years",
          required: true,
        },
        {
          category: "experience",
          description: "At least 4 years",
          required: true,
        },
      ]
    );
    expect(plan.map(({ status }) => status)).toEqual(["ready", "prepare"]);
  });

  it("leaves unstructured requirements for preparation", () => {
    const plan = buildReadinessPlan(
      {
        documents: [],
        education: [],
        experienceYears: 0,
        languages: [],
        licenses: [],
        skills: [],
      },
      [
        { category: "visa", description: "Work visa", required: true },
        { category: "other", description: "Interview", required: false },
      ]
    );
    expect(plan.map(({ status }) => status)).toEqual(["prepare", "prepare"]);
    expect(readinessCounts(plan)).toEqual({ ready: 0, total: 1 });
  });
});
