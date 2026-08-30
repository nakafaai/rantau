import type { SearchIntent } from "@repo/domain/search";
import { Array as EffectArray, Schema } from "effect";

const COUNTRY_LANE_SOURCE_LIMIT = 15;
const GLOBAL_LANE_SOURCE_LIMIT = 10;

export const SEARCH_RESULT_TARGET = 50;
export const SEARCH_RESULT_LIMIT = 100;

const GLOBAL_MARKETS = [
  "Australia",
  "Brazil",
  "Canada",
  "France",
  "Germany",
  "India",
  "Indonesia",
  "Japan",
  "Mexico",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Poland",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
] as const;

const QUERY_STRATEGIES = [
  "(hiring OR vacancy OR opening) (apply OR application)",
  '("apply now" OR "apply for this job")',
  "(careers OR jobs) (recruitment OR hiring)",
  "(site:jobs.lever.co OR site:boards.greenhouse.io OR site:job-boards.greenhouse.io)",
  "(site:myworkdayjobs.com OR site:jobs.smartrecruiters.com)",
  "(site:apply.workable.com OR site:jobs.jobvite.com OR site:careers-page.com)",
  "(site:jobstreet.com OR site:glints.com OR site:kalibrr.com)",
  "(lowongan OR karir OR pekerjaan)",
  "(ausbildung OR apprenticeship OR internship OR vocational)",
  '("full time" OR "part time" OR contract OR seasonal)',
  "(remote OR hybrid OR onsite) (apply OR hiring)",
  "(recruitment OR talent OR vacancies) -course -training",
] as const;

export const DiscoveryLane = Schema.Struct({
  limit: Schema.Int.check(Schema.isBetween({ maximum: 20, minimum: 1 })),
  market: Schema.String,
  sourceQuery: Schema.String,
});
export type DiscoveryLane = Schema.Schema.Type<typeof DiscoveryLane>;

/** Creates one quoted search phrase without leaking control characters. */
function quoted(value: string) {
  return JSON.stringify(value.replace(/[\n\r\t]/gu, " "));
}

/** Builds one source query from validated filters and a retrieval strategy. */
function sourceQuery(intent: SearchIntent, market: string, strategy: string) {
  const filters = [intent.pathway, intent.workMode].filter(Boolean).join(" ");
  return `${quoted(intent.query)} ${quoted(market)} ${filters} ${strategy} -site:linkedin.com -site:indeed.com -site:glassdoor.com`.replace(
    /\s+/gu,
    " "
  );
}

/** Plans independent query lanes that target broad, source-backed recall. */
export function discoveryLanes(intent: SearchIntent): readonly DiscoveryLane[] {
  const { country } = intent;
  if (country) {
    return QUERY_STRATEGIES.map((strategy) => ({
      limit: COUNTRY_LANE_SOURCE_LIMIT,
      market: country,
      sourceQuery: sourceQuery(intent, country, strategy),
    }));
  }

  return GLOBAL_MARKETS.map((market, index) => ({
    limit: GLOBAL_LANE_SOURCE_LIMIT,
    market,
    sourceQuery: sourceQuery(
      intent,
      market,
      EffectArray.getUnsafe(QUERY_STRATEGIES, index % QUERY_STRATEGIES.length)
    ),
  }));
}
