import { describe, expect, it } from "@effect/vitest";
import { Opportunity, opportunityFingerprint } from "@repo/domain/opportunity";
import { Schema } from "effect";

describe("Opportunity", () => {
  it("decodes a source-backed direct application", () => {
    const opportunity = Schema.decodeUnknownSync(Opportunity)({
      applicationSteps: ["Open the employer application"],
      company: "Example Health",
      deadline: null,
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
      support: [],
      title: "Care worker",
      workMode: "onsite",
    });

    expect(opportunity.pathway).toBe("job");
    expect(opportunity.requirements[0]?.category).toBe("language");
  });

  it("rejects a non-HTTP application URL", () => {
    expect(() =>
      Schema.decodeUnknownSync(Opportunity)({
        applicationSteps: ["Open the employer application"],
        company: "Example Health",
        deadline: null,
        directApplyUrl: "javascript:alert(1)",
        employmentType: "Full time",
        location: "Osaka, Japan",
        pathway: "job",
        publishedAt: null,
        requirements: [],
        salary: null,
        source: {
          kind: "employer",
          name: "Example Health careers",
          retrievedAt: "2026-08-30T00:00:00.000Z",
          url: "javascript:alert(1)",
        },
        summary: "Care role with relocation support.",
        support: [],
        title: "Care worker",
        workMode: "onsite",
      })
    ).toThrow();
  });

  it("accepts a validated email contact for support", () => {
    const opportunity = Schema.decodeUnknownSync(Opportunity)({
      applicationSteps: ["Open the employer application"],
      company: "Example Health",
      deadline: null,
      directApplyUrl: "https://example.com/jobs/nurse",
      employmentType: "Full time",
      location: "Berlin",
      pathway: "ausbildung",
      publishedAt: null,
      requirements: [],
      salary: null,
      source: {
        kind: "employer",
        name: "Example Health careers",
        retrievedAt: "2026-08-30T00:00:00.000Z",
        url: "https://example.com/jobs/nurse",
      },
      summary: "Nursing training with direct employer support.",
      support: [
        {
          description: "Contact the training team",
          name: "Training team",
          url: "mailto:training@example.com",
        },
      ],
      title: "Nursing trainee",
      workMode: "onsite",
    });

    expect(opportunity.support[0]?.url).toBe("mailto:training@example.com");
  });

  it("normalizes a mirrored opportunity into one fingerprint", () => {
    expect(
      opportunityFingerprint({
        company: "  Example   Coffee ",
        location: "Jakarta, Indonesia",
        title: "Senior BARISTA",
      })
    ).toBe("example coffee|senior barista|jakarta, indonesia");
  });
});
