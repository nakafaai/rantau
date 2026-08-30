import { v } from "convex/values";

export const localeValidator = v.union(v.literal("en"), v.literal("id"));

export const pathwayValidator = v.union(
  v.literal("job"),
  v.literal("ausbildung"),
  v.literal("apprenticeship"),
  v.literal("internship"),
  v.literal("vocational")
);

export const workModeValidator = v.union(
  v.literal("onsite"),
  v.literal("hybrid"),
  v.literal("remote")
);

export const languageValidator = v.object({
  language: v.string(),
  level: v.string(),
});

export const profileInputValidator = v.object({
  desiredLocations: v.array(v.string()),
  desiredRoles: v.array(v.string()),
  documents: v.array(v.string()),
  education: v.array(v.string()),
  experienceYears: v.number(),
  languages: v.array(languageValidator),
  licenses: v.array(v.string()),
  locale: localeValidator,
  pathways: v.array(pathwayValidator),
  skills: v.array(v.string()),
  visaNotes: v.optional(v.string()),
  workModes: v.array(workModeValidator),
});

export const requirementCategoryValidator = v.union(
  v.literal("document"),
  v.literal("education"),
  v.literal("experience"),
  v.literal("language"),
  v.literal("license"),
  v.literal("skill"),
  v.literal("visa"),
  v.literal("other")
);

export const requirementValidator = v.object({
  category: requirementCategoryValidator,
  description: v.string(),
  required: v.boolean(),
});

export const sourceValidator = v.object({
  kind: v.union(
    v.literal("employer"),
    v.literal("government"),
    v.literal("program"),
    v.literal("aggregator")
  ),
  name: v.string(),
  retrievedAt: v.string(),
  url: v.string(),
});

export const supportValidator = v.object({
  description: v.string(),
  name: v.string(),
  url: v.union(v.string(), v.null()),
});

export const opportunityValidator = v.object({
  applicationSteps: v.array(v.string()),
  company: v.string(),
  deadline: v.union(v.string(), v.null()),
  directApplyUrl: v.string(),
  employmentType: v.string(),
  location: v.string(),
  pathway: pathwayValidator,
  publishedAt: v.union(v.string(), v.null()),
  requirements: v.array(requirementValidator),
  salary: v.union(v.string(), v.null()),
  source: sourceValidator,
  summary: v.string(),
  support: v.array(supportValidator),
  title: v.string(),
  workMode: workModeValidator,
});

export const applicationStatusValidator = v.union(
  v.literal("saved"),
  v.literal("applied"),
  v.literal("interview"),
  v.literal("offer"),
  v.literal("accepted"),
  v.literal("rejected"),
  v.literal("withdrawn")
);

export const readinessStepValidator = v.object({
  category: v.string(),
  description: v.string(),
  status: v.union(
    v.literal("ready"),
    v.literal("prepare"),
    v.literal("verify")
  ),
});
