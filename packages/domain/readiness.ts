import type { OpportunityRequirement } from "@repo/domain/opportunity";
import { Option, Schema } from "effect";

const EXPERIENCE_PATTERN = /(\d+(?:\.\d+)?)\s*(?:years?|yrs?|tahun)/iu;
const LANGUAGE_LEVEL_PATTERN = /\b[ABC][12]\b/u;

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
  required: Schema.Boolean,
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
    case "license":
      return normalized(profile.licenses);
    case "skill":
      return normalized(profile.skills);
    default:
      return [];
  }
}

const languageLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
type LanguageLevel = (typeof languageLevels)[number];
const languageRanks = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
} as const satisfies Record<LanguageLevel, number>;
const LanguageLevel = Schema.Literals(languageLevels);

/** Compares an explicit language and level without accepting lower levels. */
function matchesLanguage(profile: CandidateProfile, description: string) {
  const normalizedDescription = description.toLocaleLowerCase();
  const requiredLevel = Option.getOrUndefined(
    Schema.decodeUnknownOption(LanguageLevel)(
      description.toUpperCase().match(LANGUAGE_LEVEL_PATTERN)?.[0]
    )
  );

  return profile.languages.some(({ language, level }) => {
    if (!normalizedDescription.includes(language.toLocaleLowerCase().trim())) {
      return false;
    }
    if (!requiredLevel) {
      return true;
    }
    const candidateLevel = Option.getOrUndefined(
      Schema.decodeUnknownOption(LanguageLevel)(level.toUpperCase())
    );
    return candidateLevel
      ? languageRanks[candidateLevel] >= languageRanks[requiredLevel]
      : false;
  });
}

/** Compares a stated years requirement when the source exposes one. */
function matchesExperience(profile: CandidateProfile, description: string) {
  const requiredYears = description.match(EXPERIENCE_PATTERN)?.[1];
  return requiredYears
    ? profile.experienceYears >= Number(requiredYears)
    : false;
}

/** Checks whether one requirement is represented by candidate evidence. */
function matchesProfile(
  profile: CandidateProfile,
  requirement: OpportunityRequirement
) {
  const description = requirement.description.toLocaleLowerCase();
  if (requirement.category === "language") {
    return matchesLanguage(profile, requirement.description);
  }
  if (requirement.category === "experience") {
    return matchesExperience(profile, requirement.description);
  }
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
        required: requirement.required,
        status: "verify" as const,
      };
    }

    return {
      category: requirement.category,
      description: requirement.description,
      required: requirement.required,
      status: matchesProfile(profile, requirement)
        ? ("ready" as const)
        : ("prepare" as const),
    };
  });
}

/** Counts only required preparation facts without inventing a percentage. */
export function readinessCounts(steps: readonly ReadinessStep[]) {
  const required = steps.filter((step) => step.required);
  return {
    ready: required.filter(({ status }) => status === "ready").length,
    total: required.length,
  };
}
