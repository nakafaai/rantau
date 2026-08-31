import type { Doc } from "@repo/backend/convex/_generated/dataModel";
import { OpportunityPathway, WorkMode } from "@repo/domain/opportunity";
import { WorkAuthorization } from "@repo/domain/profile";
import {
  createFormHook,
  createFormHookContexts,
  formOptions,
} from "@tanstack/react-form";
import { Schema } from "effect";
import { skillOptions } from "@/lib/profile";

const StringList = Schema.mutable(Schema.Array(Schema.String));
const ProfileFormState = Schema.Struct({
  country: Schema.String,
  documents: StringList,
  education: Schema.String,
  experience: Schema.NullOr(
    Schema.Finite.check(Schema.isBetween({ maximum: 80, minimum: 0 }))
  ),
  language1: Schema.String,
  language2: Schema.String,
  level1: Schema.String,
  level2: Schema.String,
  license: Schema.String,
  otherSkill: Schema.String,
  pathways: Schema.mutable(Schema.Array(OpportunityPathway)),
  role: Schema.String,
  skills: StringList,
  workAuthorization: WorkAuthorization,
  workModes: Schema.mutable(Schema.Array(WorkMode)),
});

export type ProfileFormValues = Schema.Schema.Type<typeof ProfileFormState>;

/** Projects one stored profile into editable, controlled form values. */
export function profileFormDefaults(
  current: Doc<"profiles"> | null
): ProfileFormValues {
  const knownSkills: ReadonlySet<string> = new Set(
    skillOptions.map((skill) => skill.value)
  );
  const otherSkill = current?.skills.find((skill) => !knownSkills.has(skill));

  return {
    country: current?.desiredLocations[0] ?? "",
    documents: [...(current?.documents ?? [])],
    education: current?.education[0] ?? "",
    experience: current?.experienceYears ?? 0,
    language1: current?.languages[0]?.language ?? "",
    language2: current?.languages[1]?.language ?? "",
    level1: current?.languages[0]?.level ?? "",
    level2: current?.languages[1]?.level ?? "",
    license: current?.licenses[0] ?? "",
    otherSkill: otherSkill ?? "",
    pathways: [...(current?.pathways ?? ["job"])],
    role: current?.desiredRoles[0] ?? "",
    skills: (current?.skills ?? []).filter((skill) => knownSkills.has(skill)),
    workAuthorization: current?.workAuthorization ?? "unsure",
    workModes: [...(current?.workModes ?? ["onsite", "hybrid", "remote"])],
  };
}

const profileFormSchema = Schema.toStandardSchemaV1(ProfileFormState);

export const profileFormOptions = formOptions({
  defaultValues: profileFormDefaults(null),
  validators: {
    onChange: profileFormSchema,
    onSubmit: profileFormSchema,
  },
});

const { fieldContext, formContext } = createFormHookContexts();

export const { useAppForm: useProfileForm, withForm: withProfileForm } =
  createFormHook({
    fieldComponents: {},
    fieldContext,
    formComponents: {},
    formContext,
  });
