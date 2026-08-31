import { describe, expect, it } from "@effect/vitest";
import {
  DISCOVERY_EVALUATION_CASES,
  evaluateDiscoveryResults,
} from "@repo/domain/discoveryeval";
import type { Opportunity } from "@repo/domain/opportunity";
import { Effect, Array as EffectArray } from "effect";

const evaluation = DISCOVERY_EVALUATION_CASES.find(
  ({ place }) => place.countryCode === "ID" && place.level === "country"
);

/** Creates one source-backed evaluation fixture. */
function opportunity(index: number): Opportunity {
  const url = `https://employer.example/jobs/${index}`;
  return {
    applicationSteps: ["Apply"],
    company: "Example Health",
    country: "Indonesia",
    countryCode: "ID",
    deadline: null,
    directApplyUrl: url,
    employmentType: "Full time",
    location: "Jakarta, Indonesia",
    pathway: "job",
    publishedAt: null,
    requirements: [],
    salary: null,
    source: {
      kind: "employer",
      name: "Example Health",
      retrievedAt: "2026-08-30T00:00:00.000Z",
      url,
    },
    summary: "Current doctor role.",
    support: [],
    title: `Doctor ${index}`,
    workMode: "onsite",
  };
}

describe("discovery evaluation", () => {
  it.effect("passes fifty distinct place-matched direct results", () =>
    Effect.gen(function* () {
      expect(evaluation).toBeDefined();
      if (!evaluation) {
        return;
      }
      const report = yield* evaluateDiscoveryResults(
        evaluation,
        EffectArray.makeBy(50, opportunity)
      );

      expect(report).toEqual({
        directSourceRate: 1,
        distinctRate: 1,
        geographicMatchRate: 1,
        passed: true,
        sourceBoundRate: 1,
        total: 50,
      });
    })
  );

  it.effect("fails sparse, duplicated, mismatched, or unbound results", () =>
    Effect.gen(function* () {
      expect(evaluation).toBeDefined();
      if (!evaluation) {
        return;
      }
      const first = opportunity(1);
      const mirrorUrl = "https://marketplace.example/jobs/1";
      const report = yield* evaluateDiscoveryResults(evaluation, [
        first,
        {
          ...first,
          company: "Different Health",
          country: "Germany",
          countryCode: "DE",
          directApplyUrl: "https://different.example/apply",
          location: "Berlin, Germany",
          source: { ...first.source, kind: "aggregator" },
        },
        {
          ...first,
          directApplyUrl: mirrorUrl,
          source: { ...first.source, url: mirrorUrl },
        },
      ]);

      expect(report).toEqual({
        directSourceRate: 2 / 3,
        distinctRate: 2 / 3,
        geographicMatchRate: 2 / 3,
        passed: false,
        sourceBoundRate: 2 / 3,
        total: 3,
      });
    })
  );

  it.effect("reports stable zero rates for an empty capture", () =>
    Effect.gen(function* () {
      expect(evaluation).toBeDefined();
      if (!evaluation) {
        return;
      }
      const report = yield* evaluateDiscoveryResults(evaluation, []);

      expect(report).toEqual({
        directSourceRate: 0,
        distinctRate: 0,
        geographicMatchRate: 0,
        passed: false,
        sourceBoundRate: 0,
        total: 0,
      });
    })
  );
});
