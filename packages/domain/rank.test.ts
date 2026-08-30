import { describe, expect, it } from "@effect/vitest";
import type { Opportunity } from "@repo/domain/opportunity";
import { recommendationScore } from "@repo/domain/rank";

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
      country: "Germany",
      pathway: "job" as const,
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
});
