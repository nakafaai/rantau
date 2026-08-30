import {
  type Opportunity,
  opportunityFingerprint,
} from "@repo/domain/opportunity";
import { Effect, HashSet, Schema } from "effect";

export const DiscoveryEvaluationCase = Schema.Struct({
  country: Schema.String,
  minimumCountryMatchRate: Schema.Number,
  minimumDistinctRate: Schema.Number,
  minimumResults: Schema.Int,
  name: Schema.String,
  query: Schema.String,
});
export type DiscoveryEvaluationCase = Schema.Schema.Type<
  typeof DiscoveryEvaluationCase
>;

export const DISCOVERY_EVALUATION_CASES = [
  {
    country: "Indonesia",
    minimumCountryMatchRate: 0.8,
    minimumDistinctRate: 0.9,
    minimumResults: 50,
    name: "Indonesian hospitality",
    query: "barista",
  },
  {
    country: "Germany",
    minimumCountryMatchRate: 0.8,
    minimumDistinctRate: 0.9,
    minimumResults: 50,
    name: "German healthcare",
    query: "nurse",
  },
  {
    country: "Singapore",
    minimumCountryMatchRate: 0.8,
    minimumDistinctRate: 0.9,
    minimumResults: 50,
    name: "Singapore technology",
    query: "software engineer",
  },
] as const satisfies readonly DiscoveryEvaluationCase[];

export const DiscoveryEvaluationReport = Schema.Struct({
  countryMatchRate: Schema.Number,
  distinctRate: Schema.Number,
  passed: Schema.Boolean,
  sourceBoundRate: Schema.Number,
  total: Schema.Int,
});
export type DiscoveryEvaluationReport = Schema.Schema.Type<
  typeof DiscoveryEvaluationReport
>;

/** Evaluates deterministic quality contracts over one captured search result. */
export const evaluateDiscoveryResults = Effect.fn("discovery.evaluateResults")(
  function* (
    evaluation: DiscoveryEvaluationCase,
    opportunities: readonly Opportunity[]
  ) {
    const total = opportunities.length;
    const denominator = Math.max(total, 1);
    const uniqueOpportunities = HashSet.fromIterable(
      opportunities.map(opportunityFingerprint)
    );
    const country = evaluation.country.toLocaleLowerCase();
    const countryMatches = opportunities.filter((opportunity) =>
      [opportunity.country, opportunity.location]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase().includes(country))
    ).length;
    const sourceBound = opportunities.filter(
      (opportunity) => opportunity.directApplyUrl === opportunity.source.url
    ).length;
    const countryMatchRate = countryMatches / denominator;
    const distinctRate = HashSet.size(uniqueOpportunities) / denominator;
    const sourceBoundRate = sourceBound / denominator;

    return DiscoveryEvaluationReport.make({
      countryMatchRate,
      distinctRate,
      passed:
        total >= evaluation.minimumResults &&
        countryMatchRate >= evaluation.minimumCountryMatchRate &&
        distinctRate >= evaluation.minimumDistinctRate &&
        sourceBoundRate === 1,
      sourceBoundRate,
      total,
    });
  }
);
