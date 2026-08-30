import type { api } from "@repo/backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

export type OpportunityRecord = FunctionReturnType<
  typeof api.opportunities.list
>[number];

/** Builds the clearest supported city and country label. */
export function locationLabel(record: OpportunityRecord) {
  const { city, country, location } = record.opportunity.opportunity;
  return [city, country].filter(Boolean).join(", ") || location;
}

/** Builds a deterministic Google Maps search link for a source-backed place. */
export function mapsUrl(record: OpportunityRecord) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLabel(record))}`;
}
