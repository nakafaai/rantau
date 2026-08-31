import { placeLabel, placeTerms } from "@repo/domain/place";
import type { SearchIntent } from "@repo/domain/search";
import { Array as EffectArray, Schema } from "effect";

const PLACE_LANE_SOURCE_LIMIT = 15;
const GLOBAL_LANE_SOURCE_LIMIT = 15;
const INITIAL_STRATEGY_COUNT = 4;
const INITIAL_MARKET_COUNT = 11;

export const SEARCH_RESULT_TARGET = 50;
export const SEARCH_RESULT_LIMIT = 100;

export const DiscoveryStage = Schema.Literals(["initial", "expansion"]);
export type DiscoveryStage = Schema.Schema.Type<typeof DiscoveryStage>;

const GLOBAL_MARKETS = [
  "Indonesia",
  "Malaysia",
  "Singapore",
  "Thailand",
  "Philippines",
  "Vietnam",
  "Brunei",
  "Cambodia",
  "Laos",
  "Myanmar",
  "Timor-Leste",
  "Germany",
  "Australia",
  "Canada",
  "France",
  "Japan",
  "Netherlands",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
] as const;

const QUERY_STRATEGIES = [
  "(hiring OR vacancy OR opening OR lowongan) (apply OR application OR lamar)",
  '("apply now" OR "join our team" OR careers OR karir)',
  "(site:jobs.lever.co OR site:boards.greenhouse.io OR site:myworkdayjobs.com OR site:apply.workable.com)",
  "(site:jobstreet.com OR site:glints.com OR site:kalibrr.com)",
  "(hospital OR clinic OR university OR school OR hotel OR company) (careers OR vacancies OR jobs)",
  "(government OR public OR ministry OR municipal) (jobs OR careers OR recruitment)",
  '("full time" OR "part time" OR contract OR internship) (hiring OR recruitment)',
  '("direct apply" OR "application form" OR "submit application" OR "lamar sekarang")',
] as const;

export const DiscoveryLane = Schema.Struct({
  limit: Schema.Int.check(Schema.isBetween({ maximum: 100, minimum: 1 })),
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
  const geography = intent.place
    ? placeTerms(intent.place).map(quoted).join(" ")
    : quoted(market);
  return `${quoted(intent.query)} ${geography} ${filters} ${strategy} -site:linkedin.com -site:indeed.com -site:glassdoor.com`.replace(
    /\s+/gu,
    " "
  );
}

/** Selects the bounded strategy slice for one adaptive search stage. */
function stageStrategies(stage: DiscoveryStage) {
  return stage === "initial"
    ? QUERY_STRATEGIES.slice(0, INITIAL_STRATEGY_COUNT)
    : QUERY_STRATEGIES.slice(INITIAL_STRATEGY_COUNT);
}

/** Plans one stage of independent retrieval lanes for verified recall. */
export function discoveryLanes(
  intent: SearchIntent,
  stage: DiscoveryStage = "initial"
): readonly DiscoveryLane[] {
  if (intent.place) {
    const market = placeLabel(intent.place);
    return stageStrategies(stage).map((strategy) => ({
      limit: PLACE_LANE_SOURCE_LIMIT,
      market,
      sourceQuery: sourceQuery(intent, market, strategy),
    }));
  }

  const markets =
    stage === "initial"
      ? GLOBAL_MARKETS.slice(0, INITIAL_MARKET_COUNT)
      : GLOBAL_MARKETS.slice(INITIAL_MARKET_COUNT);
  return markets.map((market, index) => ({
    limit: GLOBAL_LANE_SOURCE_LIMIT,
    market,
    sourceQuery: sourceQuery(
      intent,
      market,
      EffectArray.getUnsafe(
        QUERY_STRATEGIES,
        (stage === "initial" ? index : index + INITIAL_STRATEGY_COUNT) %
          QUERY_STRATEGIES.length
      )
    ),
  }));
}
