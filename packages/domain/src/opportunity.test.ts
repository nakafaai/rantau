import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { Opportunity } from "./opportunity";

describe("Opportunity", () => {
  it("decodes a source-backed direct application", () => {
    const opportunity = Schema.decodeUnknownSync(Opportunity)({
      company: "Example Health",
      directApplyUrl: "https://example.com/jobs/nurse",
      employmentType: "Full time",
      location: "Osaka, Japan",
      pathway: "job",
      publishedAt: null,
      requirements: [
        { category: "language", description: "Japanese N4", required: true },
      ],
      salary: null,
      source: {
        kind: "employer",
        name: "Example Health careers",
        retrievedAt: "2026-08-30T00:00:00.000Z",
        url: "https://example.com/jobs/nurse",
      },
      summary: "Care role with relocation support.",
      title: "Care worker",
      workMode: "onsite",
    });

    expect(opportunity.pathway).toBe("job");
    expect(opportunity.requirements[0]?.category).toBe("language");
  });
});
