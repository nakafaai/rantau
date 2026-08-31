import { describe, expect, it } from "@effect/vitest";
import type { Opportunity } from "@repo/domain/opportunity";
import { recommendationLevel, recommendationScore } from "@repo/domain/rank";

/** Builds a complete source-backed opportunity for ranking tests. */
function opportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    applicationSteps: ["Apply"],
    company: "Example Hospital",
    country: "Germany",
    countryCode: "DE",
    deadline: "2026-10-01",
    directApplyUrl: "https://example.com/apply",
    employmentType: "Full time",
    location: "Berlin, Germany",
    pathway: "job",
    publishedAt: "2026-08-20",
    requirements: [],
    salary: "EUR 3,000",
    source: {
      kind: "employer",
      name: "Example Hospital",
      retrievedAt: "2026-08-30T00:00:00.000Z",
      url: "https://example.com/apply",
    },
    summary: "Nursing role in a hospital.",
    support: [],
    title: "Registered Nurse",
    workMode: "onsite",
    ...overrides,
  };
}

describe("recommendationScore", () => {
  it("ranks explicit and saved preferences above unrelated work", () => {
    const intent = {
      pathway: "job" as const,
      place: {
        country: "Germany",
        countryCode: "DE",
        level: "country" as const,
      },
      query: "nurse",
      workMode: "onsite" as const,
    };
    const profile = {
      desiredLocations: ["Germany"],
      desiredRoles: ["Nurse"],
      pathways: ["job" as const],
      skills: ["Nursing"],
      workModes: ["onsite" as const],
    };

    const matched = recommendationScore(opportunity(), intent, profile);
    const unrelated = recommendationScore(
      opportunity({
        company: "Remote Studio",
        country: "Canada",
        location: "Toronto, Canada",
        pathway: "internship",
        salary: null,
        summary: "Design internship.",
        title: "Design Intern",
        workMode: "remote",
      }),
      intent,
      profile
    );

    expect(matched).toBeGreaterThan(unrelated);
    expect(matched).toBeLessThanOrEqual(100);
  });

  it("keeps sparse aggregator results below direct source matches", () => {
    const sparse = recommendationScore(
      opportunity({
        city: undefined,
        country: undefined,
        deadline: null,
        salary: null,
        source: {
          kind: "aggregator",
          name: "Listing index",
          retrievedAt: "2026-08-30T00:00:00.000Z",
          url: "https://example.com/apply",
        },
      }),
      { query: "a" },
      null
    );

    expect(sparse).toBe(10);
  });
});

describe("recommendationLevel", () => {
  it("maps boundary scores into an ordered match hierarchy", () => {
    expect(recommendationLevel(100)).toBe("excellent");
    expect(recommendationLevel(85)).toBe("excellent");
    expect(recommendationLevel(84)).toBe("strong");
    expect(recommendationLevel(70)).toBe("strong");
    expect(recommendationLevel(69)).toBe("fair");
    expect(recommendationLevel(55)).toBe("fair");
    expect(recommendationLevel(54)).toBe("limited");
    expect(recommendationLevel(0)).toBe("limited");
  });
});
