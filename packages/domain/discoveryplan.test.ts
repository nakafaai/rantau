import { describe, expect, it } from "@effect/vitest";
import {
  discoveryLanes,
  SEARCH_RESULT_LIMIT,
  SEARCH_RESULT_TARGET,
} from "@repo/domain/discoveryplan";
import { SearchIntent, SearchQuery } from "@repo/domain/search";
import { Effect } from "effect";

describe("discovery plan", () => {
  it.effect("fans one country into diverse bounded retrieval lanes", () =>
    Effect.gen(function* () {
      const intent = SearchIntent.make({
        country: "Indonesia",
        locale: "id",
        pathway: "job",
        query: SearchQuery.make("barista\nshift"),
        workMode: "onsite",
      });
      const lanes = discoveryLanes(intent);

      expect(lanes).toHaveLength(12);
      expect(new Set(lanes.map(({ sourceQuery }) => sourceQuery)).size).toBe(
        lanes.length
      );
      expect(lanes.every(({ limit }) => limit === 15)).toBe(true);
      expect(lanes.every(({ market }) => market === "Indonesia")).toBe(true);
      expect(
        lanes.every(({ sourceQuery }) =>
          sourceQuery.includes('"barista shift" "Indonesia" job onsite')
        )
      ).toBe(true);
      expect(lanes[0]?.sourceQuery).toContain("-site:linkedin.com");
    })
  );

  it.effect("distributes a worldwide search across twenty markets", () =>
    Effect.gen(function* () {
      const lanes = discoveryLanes(
        SearchIntent.make({
          locale: "en",
          query: SearchQuery.make("nurse"),
        })
      );

      expect(lanes).toHaveLength(20);
      expect(new Set(lanes.map(({ market }) => market)).size).toBe(20);
      expect(lanes.every(({ limit }) => limit === 10)).toBe(true);
      expect(lanes[0]?.sourceQuery).toContain('"nurse" "Australia"');
      expect(SEARCH_RESULT_TARGET).toBe(50);
      expect(SEARCH_RESULT_LIMIT).toBe(100);
    })
  );
});
