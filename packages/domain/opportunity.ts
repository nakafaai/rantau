import { Schema } from "effect";

export const HttpUrl = Schema.String.check(
  Schema.isPattern(/^https?:\/\/[^\s]+$/iu)
);

export const SupportUrl = Schema.String.check(
  Schema.isPattern(/^(?:https?:\/\/[^\s]+|mailto:[^\s@]+@[^\s@]+\.[^\s@]+)$/iu)
);

export const OpportunityPathway = Schema.Literals([
  "job",
  "ausbildung",
  "apprenticeship",
  "internship",
  "vocational",
]);

export const WorkMode = Schema.Literals(["onsite", "hybrid", "remote"]);

export const SourceKind = Schema.Literals([
  "employer",
  "government",
  "program",
  "aggregator",
]);

export const SourceEvidence = Schema.Struct({
  kind: SourceKind,
  name: Schema.String,
  retrievedAt: Schema.String,
  url: HttpUrl,
});

export const OpportunityRequirement = Schema.Struct({
  category: Schema.Literals([
    "document",
    "education",
    "experience",
    "language",
    "license",
    "skill",
    "visa",
    "other",
  ]),
  description: Schema.String,
  required: Schema.Boolean,
});

export const SupportResource = Schema.Struct({
  description: Schema.String,
  name: Schema.String,
  url: Schema.NullOr(SupportUrl),
});

export const Opportunity = Schema.Struct({
  applicationSteps: Schema.Array(Schema.String).check(
    Schema.isLengthBetween(1, 8)
  ),
  company: Schema.String,
  deadline: Schema.NullOr(Schema.String),
  directApplyUrl: HttpUrl,
  employmentType: Schema.String,
  location: Schema.String,
  pathway: OpportunityPathway,
  publishedAt: Schema.NullOr(Schema.String),
  requirements: Schema.Array(OpportunityRequirement),
  salary: Schema.NullOr(Schema.String),
  source: SourceEvidence,
  summary: Schema.String,
  support: Schema.Array(SupportResource).check(Schema.isLengthBetween(0, 8)),
  title: Schema.String,
  workMode: WorkMode,
});

export type Opportunity = Schema.Schema.Type<typeof Opportunity>;
export type OpportunityRequirement = Schema.Schema.Type<
  typeof OpportunityRequirement
>;
export type SupportResource = Schema.Schema.Type<typeof SupportResource>;
