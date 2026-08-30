import { describe, expect, it } from "@effect/vitest";
import {
  DISCOVERY_EVALUATION_CASES,
  evaluateDiscoveryResults,
} from "@repo/domain/discoveryeval";
import type { Opportunity } from "@repo/domain/opportunity";
import { Effect, Array as EffectArray } from "effect";

const [evaluation] = DISCOVERY_EVALUATION_CASES;

/** Creates one source-backed evaluation fixture. */
function opportunity(index: number): Opportunity {
  const url = `https://employer.example/jobs/${index}`;
  return {
    applicationSteps: ["Apply"],
    company: "Example Coffee",
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
      name: "Example Coffee",
      retrievedAt: "2026-08-30T00:00:00.000Z",
      url,
    },
    summary: "Current barista role.",
    support: [],
    title: `Barista ${index}`,
    workMode: "onsite",
  };
}

describe("discovery evaluation", () => {
  it.effect("passes fifty distinct country-matched source-backed results", () =>
    Effect.gen(function* () {
      const report = yield* evaluateDiscoveryResults(
        evaluation,
        EffectArray.makeBy(50, opportunity)
      );

      expect(report).toEqual({
        countryMatchRate: 1,
        distinctRate: 1,
        passed: true,
        sourceBoundRate: 1,
        total: 50,
      });
    })
  );

  it.effect("fails sparse, duplicated, mismatched, or unbound results", () =>
    Effect.gen(function* () {
      const first = opportunity(1);
      const mirrorUrl = "https://marketplace.example/jobs/1";
      const report = yield* evaluateDiscoveryResults(evaluation, [
        first,
        {
          ...first,
          company: "Different Coffee",
          country: "Germany",
          directApplyUrl: "https://different.example/apply",
          location: "Berlin, Germany",
        },
        {
          ...first,
          directApplyUrl: mirrorUrl,
          source: { ...first.source, url: mirrorUrl },
        },
      ]);

      expect(report).toEqual({
        countryMatchRate: 2 / 3,
        distinctRate: 2 / 3,
        passed: false,
        sourceBoundRate: 2 / 3,
        total: 3,
      });
    })
  );

  it.effect("reports stable zero rates for an empty capture", () =>
    Effect.gen(function* () {
      const report = yield* evaluateDiscoveryResults(evaluation, []);

      expect(report).toEqual({
        countryMatchRate: 0,
        distinctRate: 0,
        passed: false,
        sourceBoundRate: 0,
        total: 0,
      });
    })
  );
});
