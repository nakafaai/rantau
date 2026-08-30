import type { api } from "@repo/backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

export type ApplicationRecord = FunctionReturnType<
  typeof api.applications.list
>[number];

/** Builds the most specific supported application location label. */
export function applicationLocation(record: ApplicationRecord) {
  const { city, country, location } = record.opportunity.opportunity;
  return [city, country].filter(Boolean).join(", ") || location;
}

/** Builds a Google Maps search link for an application location. */
export function applicationMapsUrl(record: ApplicationRecord) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(applicationLocation(record))}`;
}
