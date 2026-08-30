import type { OpportunityRequirement } from "@repo/domain/opportunity";
import { Schema } from "effect";

export const CandidateProfile = Schema.Struct({
  documents: Schema.Array(Schema.String).check(Schema.isLengthBetween(0, 30)),
  education: Schema.Array(Schema.String).check(Schema.isLengthBetween(0, 30)),
  experienceYears: Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0)),
  languages: Schema.Array(
    Schema.Struct({
      language: Schema.String,
      level: Schema.String,
    })
  ).check(Schema.isLengthBetween(0, 30)),
  licenses: Schema.Array(Schema.String).check(Schema.isLengthBetween(0, 30)),
  skills: Schema.Array(Schema.String).check(Schema.isLengthBetween(0, 50)),
});
export type CandidateProfile = Schema.Schema.Type<typeof CandidateProfile>;

export const ReadinessStep = Schema.Struct({
  category: Schema.String,
  description: Schema.String,
  status: Schema.Literals(["ready", "prepare", "verify"]),
});
export type ReadinessStep = Schema.Schema.Type<typeof ReadinessStep>;

/** Normalizes comparable profile values without changing source records. */
function normalized(values: readonly string[]) {
  return values.map((value) => value.toLocaleLowerCase().trim());
}

/** Selects candidate evidence owned by a requirement category. */
function profileValues(profile: CandidateProfile, category: string) {
  switch (category) {
    case "document":
      return normalized(profile.documents);
    case "education":
      return normalized(profile.education);
    case "language":
      return normalized(
        profile.languages.flatMap(({ language, level }) => [
          language,
          `${language} ${level}`,
        ])
      );
    case "license":
      return normalized(profile.licenses);
    case "skill":
      return normalized(profile.skills);
    default:
      return [];
  }
}

/** Checks whether one requirement is represented by candidate evidence. */
function matchesProfile(
  profile: CandidateProfile,
  requirement: OpportunityRequirement
) {
  const description = requirement.description.toLocaleLowerCase();
  return profileValues(profile, requirement.category).some(
    (value) => description.includes(value) || value.includes(description)
  );
}

/** Projects requirements into explicit candidate preparation states. */
export function buildReadinessPlan(
  profile: CandidateProfile | null,
  requirements: readonly OpportunityRequirement[]
): readonly ReadinessStep[] {
  return requirements.map((requirement) => {
    if (!profile) {
      return {
        category: requirement.category,
        description: requirement.description,
        status: "verify" as const,
      };
    }

    return {
      category: requirement.category,
      description: requirement.description,
      status: matchesProfile(profile, requirement)
        ? ("ready" as const)
        : ("prepare" as const),
    };
  });
}

/** Calculates the share of readiness steps already satisfied. */
export function readinessPercent(steps: readonly ReadinessStep[]) {
  if (steps.length === 0) {
    return 100;
  }

  const ready = steps.filter(({ status }) => status === "ready").length;
  return Math.round((ready / steps.length) * 100);
}
