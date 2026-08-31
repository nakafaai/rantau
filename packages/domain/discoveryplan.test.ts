import { describe, expect, it } from "@effect/vitest";
import {
  discoveryLanes,
  SEARCH_RESULT_LIMIT,
  SEARCH_RESULT_TARGET,
} from "@repo/domain/discoveryplan";
import { SearchIntent, SearchQuery } from "@repo/domain/search";
import { Effect } from "effect";

describe("discovery plan", () => {
  it.effect("fans one city into focused initial and expansion lanes", () =>
    Effect.gen(function* () {
      const intent = SearchIntent.make({
        locale: "id",
        pathway: "job",
        place: {
          city: "Bandung",
          country: "Indonesia",
          countryCode: "ID",
          level: "city",
          region: "West Java",
          regionCode: "JB",
        },
        query: SearchQuery.make("dokter\nspesialis"),
        workMode: "onsite",
      });
      const initial = discoveryLanes(intent);
      const expansion = discoveryLanes(intent, "expansion");
      const lanes = [...initial, ...expansion];

      expect(initial).toHaveLength(4);
      expect(expansion).toHaveLength(4);
      expect(new Set(lanes.map(({ sourceQuery }) => sourceQuery)).size).toBe(
        lanes.length
      );
      expect(lanes.every(({ limit }) => limit === 15)).toBe(true);
      expect(
        lanes.every(({ market }) => market === "Bandung, West Java, Indonesia")
      ).toBe(true);
      expect(initial[0]?.sourceQuery).toContain(
        '"dokter spesialis" "Bandung" "West Java" "Indonesia" job onsite'
      );
      expect(initial[0]?.sourceQuery).toContain("-site:linkedin.com");
    })
  );

  it.effect("distributes global stages across twenty distinct markets", () =>
    Effect.gen(function* () {
      const intent = SearchIntent.make({
        locale: "en",
        query: SearchQuery.make("nurse"),
      });
      const initial = discoveryLanes(intent);
      const expansion = discoveryLanes(intent, "expansion");
      const lanes = [...initial, ...expansion];

      expect(initial).toHaveLength(11);
      expect(expansion).toHaveLength(9);
      expect(new Set(lanes.map(({ market }) => market)).size).toBe(20);
      expect(lanes.every(({ limit }) => limit === 15)).toBe(true);
      expect(initial[0]?.sourceQuery).toContain('"nurse" "Indonesia"');
      expect(lanes.some(({ market }) => market === "Timor-Leste")).toBe(true);
      expect(SEARCH_RESULT_TARGET).toBe(50);
      expect(SEARCH_RESULT_LIMIT).toBe(100);
    })
  );
});
