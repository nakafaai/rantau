import { Schema } from "effect";

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
  url: Schema.String,
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

export const Opportunity = Schema.Struct({
  company: Schema.String,
  directApplyUrl: Schema.String,
  employmentType: Schema.String,
  location: Schema.String,
  pathway: OpportunityPathway,
  publishedAt: Schema.NullOr(Schema.String),
  requirements: Schema.Array(OpportunityRequirement),
  salary: Schema.NullOr(Schema.String),
  source: SourceEvidence,
  summary: Schema.String,
  title: Schema.String,
  workMode: WorkMode,
});

export type Opportunity = Schema.Schema.Type<typeof Opportunity>;
export type OpportunityRequirement = Schema.Schema.Type<
  typeof OpportunityRequirement
>;
