import { describe, expect, it } from "@effect/vitest";
import {
  bindOpportunities,
  decodeDiscoverySources,
} from "@repo/domain/discovery";
import { Effect } from "effect";

describe("opportunity discovery", () => {
  it.effect("decodes a bounded source record", () =>
    Effect.gen(function* () {
      const sources = yield* decodeDiscoverySources({
        web: [
          {
            description: "Apply through the employer portal.",
            title: "Welder",
            url: "https://employer.example/jobs/welder",
          },
        ],
      });

      expect(sources).toEqual([
        {
          content: "Apply through the employer portal.",
          title: "Welder",
          url: "https://employer.example/jobs/welder",
        },
      ]);
    })
  );

  it.effect("normalizes fields and drops missing or unsafe URLs", () =>
    Effect.gen(function* () {
      const sources = yield* decodeDiscoverySources({
        web: [
          { metadata: { sourceURL: "https://one.example", title: "One" } },
          { metadata: { url: "https://two.example" }, markdown: "Two" },
          { url: "https://three.example" },
          { description: "No URL" },
          { description: "Unsafe", url: "javascript:alert(1)" },
        ],
      });
      const empty = yield* decodeDiscoverySources({});

      expect(sources).toEqual([
        { content: "", title: "One", url: "https://one.example" },
        {
          content: "Two",
          title: "https://two.example",
          url: "https://two.example",
        },
        {
          content: "",
          title: "https://three.example",
          url: "https://three.example",
        },
      ]);
      expect(empty).toEqual([]);
    })
  );

  it.effect("rejects malformed provider data", () =>
    Effect.gen(function* () {
      const error = yield* decodeDiscoverySources({ web: "invalid" }).pipe(
        Effect.flip
      );

      expect(error.message).toContain("unreadable");
    })
  );

  it.effect("pins the apply CTA to source evidence", () =>
    Effect.gen(function* () {
      const opportunities = yield* bindOpportunities(
        {
          opportunities: [
            {
              applicationSteps: ["Open the employer form"],
              company: "Example Works",
              deadline: null,
              employmentType: "Full time",
              location: "Osaka, Japan",
              pathway: "job",
              publishedAt: null,
              requirements: [],
              salary: null,
              sourceIndex: 0,
              sourceKind: "employer",
              sourceName: "Example Works",
              summary: "Entry-level welding role.",
              support: [],
              title: "Welder",
              workMode: "onsite",
            },
          ],
        },
        [
          {
            content: "Employer listing",
            title: "Welder",
            url: "https://employer.example/jobs/welder",
          },
        ],
        "2026-08-30T00:00:00.000Z"
      );

      expect(opportunities[0]?.directApplyUrl).toBe(
        "https://employer.example/jobs/welder"
      );
    })
  );

  it.effect("skips missing evidence and rejects an empty binding", () =>
    Effect.gen(function* () {
      const error = yield* bindOpportunities(
        {
          opportunities: [
            {
              applicationSteps: ["Apply"],
              company: "Example",
              deadline: null,
              employmentType: "Full time",
              location: "Berlin",
              pathway: "job",
              publishedAt: null,
              requirements: [],
              salary: null,
              sourceIndex: 2,
              sourceKind: "employer",
              sourceName: "",
              summary: "Example",
              support: [],
              title: "Role",
              workMode: "onsite",
            },
          ],
        },
        [],
        "2026-08-30T00:00:00.000Z"
      ).pipe(Effect.flip);

      expect(error.message).toContain("source-backed");
    })
  );

  it.effect("falls back to the source title for an unnamed source", () =>
    Effect.gen(function* () {
      const [opportunity] = yield* bindOpportunities(
        {
          opportunities: [
            {
              applicationSteps: ["Apply"],
              company: "Example",
              deadline: null,
              employmentType: "Full time",
              location: "Berlin",
              pathway: "job",
              publishedAt: null,
              requirements: [],
              salary: null,
              sourceIndex: 0,
              sourceKind: "employer",
              sourceName: "",
              summary: "Example",
              support: [],
              title: "Role",
              workMode: "onsite",
            },
          ],
        },
        [{ content: "", title: "Employer", url: "https://employer.example" }],
        "2026-08-30T00:00:00.000Z"
      );

      expect(opportunity?.source.name).toBe("Employer");
    })
  );
});
