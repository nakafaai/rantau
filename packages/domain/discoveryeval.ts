import {
  type Opportunity,
  opportunityFingerprint,
} from "@repo/domain/opportunity";
import { matchesPlaceScope, PlaceScope } from "@repo/domain/place";
import { Effect, HashSet, Schema } from "effect";

export const DiscoveryEvaluationCase = Schema.Struct({
  minimumDirectSourceRate: Schema.Number,
  minimumDistinctRate: Schema.Number,
  minimumGeographicMatchRate: Schema.Number,
  minimumResults: Schema.Int,
  name: Schema.String,
  place: PlaceScope,
  query: Schema.String,
});
export type DiscoveryEvaluationCase = Schema.Schema.Type<
  typeof DiscoveryEvaluationCase
>;

const COUNTRY_CASES = [
  ["Brunei Darussalam", "BN", "registered nurse"],
  ["Cambodia", "KH", "accountant"],
  ["Indonesia", "ID", "doctor"],
  ["Laos", "LA", "hotel receptionist"],
  ["Malaysia", "MY", "software engineer"],
  ["Myanmar", "MM", "civil engineer"],
  ["Philippines", "PH", "customer support"],
  ["Singapore", "SG", "data analyst"],
  ["Thailand", "TH", "chef"],
  ["Timor-Leste", "TL", "project officer"],
  ["Vietnam", "VN", "mechanical engineer"],
] as const;

export const DISCOVERY_EVALUATION_CASES = [
  ...COUNTRY_CASES.map(([country, countryCode, query]) => ({
    minimumDirectSourceRate: 0.5,
    minimumDistinctRate: 0.9,
    minimumGeographicMatchRate: 0.8,
    minimumResults: 50,
    name: `${country} broad recall`,
    place: { country, countryCode, level: "country" as const },
    query,
  })),
  {
    minimumDirectSourceRate: 0.5,
    minimumDistinctRate: 0.9,
    minimumGeographicMatchRate: 0.8,
    minimumResults: 50,
    name: "Bavaria healthcare recall",
    place: {
      country: "Germany",
      countryCode: "DE",
      level: "region",
      region: "Bavaria",
      regionCode: "BY",
    },
    query: "nurse",
  },
  {
    minimumDirectSourceRate: 0.5,
    minimumDistinctRate: 0.9,
    minimumGeographicMatchRate: 0.8,
    minimumResults: 50,
    name: "Bandung healthcare recall",
    place: {
      city: "Bandung",
      country: "Indonesia",
      countryCode: "ID",
      level: "city",
      region: "West Java",
      regionCode: "JB",
    },
    query: "doctor",
  },
] as const satisfies readonly DiscoveryEvaluationCase[];

export const DiscoveryEvaluationReport = Schema.Struct({
  directSourceRate: Schema.Number,
  distinctRate: Schema.Number,
  geographicMatchRate: Schema.Number,
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
    const geographicMatches = opportunities.filter((opportunity) =>
      matchesPlaceScope(evaluation.place, opportunity)
    ).length;
    const sourceBound = opportunities.filter(
      (opportunity) => opportunity.directApplyUrl === opportunity.source.url
    ).length;
    const directSources = opportunities.filter(
      (opportunity) => opportunity.source.kind !== "aggregator"
    ).length;
    const directSourceRate = directSources / denominator;
    const distinctRate = HashSet.size(uniqueOpportunities) / denominator;
    const geographicMatchRate = geographicMatches / denominator;
    const sourceBoundRate = sourceBound / denominator;

    return DiscoveryEvaluationReport.make({
      directSourceRate,
      distinctRate,
      geographicMatchRate,
      passed:
        total >= evaluation.minimumResults &&
        geographicMatchRate >= evaluation.minimumGeographicMatchRate &&
        distinctRate >= evaluation.minimumDistinctRate &&
        directSourceRate >= evaluation.minimumDirectSourceRate &&
        sourceBoundRate === 1,
      sourceBoundRate,
      total,
    });
  }
);
