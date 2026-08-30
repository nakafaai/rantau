import { OpportunityPathway, WorkMode } from "@repo/domain/opportunity";
import { CandidateProfile } from "@repo/domain/readiness";
import { SearchLocale } from "@repo/domain/search";
import { Schema } from "effect";

const ShortList = Schema.Array(Schema.String).check(
  Schema.isLengthBetween(0, 30)
);

export const ProfileInput = Schema.Struct({
  ...CandidateProfile.fields,
  desiredLocations: ShortList,
  desiredRoles: ShortList,
  locale: SearchLocale,
  pathways: Schema.Array(OpportunityPathway).check(
    Schema.isLengthBetween(0, 5)
  ),
  visaNotes: Schema.optional(Schema.String),
  workModes: Schema.Array(WorkMode).check(Schema.isLengthBetween(0, 3)),
});
export type ProfileInput = Schema.Schema.Type<typeof ProfileInput>;
