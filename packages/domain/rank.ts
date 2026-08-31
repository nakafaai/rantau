import type { Opportunity } from "@repo/domain/opportunity";
import { type PlaceScope, placeTerms } from "@repo/domain/place";

type RankProfile = Readonly<{
  desiredLocations: readonly string[];
  desiredRoles: readonly string[];
  pathways: readonly Opportunity["pathway"][];
  skills: readonly string[];
  workModes: readonly Opportunity["workMode"][];
}>;

type RankIntent = Readonly<{
  pathway?: Opportunity["pathway"];
  place?: PlaceScope;
  query: string;
  workMode?: Opportunity["workMode"];
}>;

export type RecommendationLevel = "excellent" | "strong" | "fair" | "limited";

const TERM_SEPARATOR = /[^\p{L}\p{N}]+/u;

/** Returns normalized terms that are meaningful for recommendation matching. */
function terms(value: string) {
  return value
    .toLocaleLowerCase()
    .split(TERM_SEPARATOR)
    .filter((term) => term.length > 2);
}

/** Returns whether any candidate term appears in the searchable result text. */
function includesTerm(searchable: string, candidates: readonly string[]) {
  return candidates.some((candidate) => searchable.includes(candidate));
}

/** Scores one opportunity against explicit intent and saved profile defaults. */
export function recommendationScore(
  opportunity: Opportunity,
  intent: RankIntent,
  profile: RankProfile | null
) {
  const searchable = [
    opportunity.title,
    opportunity.company,
    opportunity.summary,
    opportunity.location,
    opportunity.city,
    opportunity.region,
    opportunity.country,
    opportunity.employmentType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
  let score = opportunity.source.kind === "aggregator" ? 10 : 25;

  if (includesTerm(searchable, terms(intent.query))) {
    score += 30;
  }
  if (intent.place) {
    const matches = placeTerms(intent.place).filter((term) =>
      searchable.includes(term.toLocaleLowerCase())
    ).length;
    score += Math.round((matches / placeTerms(intent.place).length) * 15);
  }
  if (intent.pathway === opportunity.pathway) {
    score += 10;
  }
  if (intent.workMode === opportunity.workMode) {
    score += 10;
  }
  if (profile) {
    if (
      includesTerm(
        searchable,
        profile.desiredRoles.flatMap((role) => terms(role))
      )
    ) {
      score += 10;
    }
    if (
      profile.desiredLocations.some((location) =>
        searchable.includes(location.toLocaleLowerCase())
      )
    ) {
      score += 5;
    }
    if (profile.pathways.includes(opportunity.pathway)) {
      score += 5;
    }
    if (profile.workModes.includes(opportunity.workMode)) {
      score += 3;
    }
    if (
      includesTerm(
        searchable,
        profile.skills.flatMap((skill) => terms(skill))
      )
    ) {
      score += 7;
    }
  }
  if (opportunity.salary) {
    score += 2;
  }
  if (opportunity.deadline) {
    score += 2;
  }

  return Math.min(100, score);
}

/** Projects a numeric recommendation into a stable user-facing hierarchy. */
export function recommendationLevel(score: number): RecommendationLevel {
  if (score >= 85) {
    return "excellent";
  }
  if (score >= 70) {
    return "strong";
  }
  if (score >= 55) {
    return "fair";
  }
  return "limited";
}
