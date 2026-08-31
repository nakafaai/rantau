"use client";

import { toast } from "@heroui/react";
import { api } from "@repo/backend/convex/_generated/api";
import { ProfileInput } from "@repo/domain/profile";
import { useQuery } from "convex/react";
import { Effect, Schema } from "effect";
import { useLocale, useTranslations } from "next-intl";
import { ProfileForm } from "@/components/form";
import { Header } from "@/components/header";
import { useSaveProfile } from "@/hooks/profile";
import type { ProfileFormValues } from "@/lib/profile-form";

/** Normalizes optional profile text before domain validation. */
function optionalText(value: string) {
  return value.trim() || undefined;
}

/** Normalizes one controlled multi-select value list. */
function selectedValues(values: readonly string[]) {
  return values.flatMap((value) => {
    const selected = value.trim();
    return selected ? [selected] : [];
  });
}

/** Reads the two controlled language rows without storage grammar. */
function selectedLanguages(values: ProfileFormValues) {
  return [
    { language: values.language1, level: values.level1 },
    { language: values.language2, level: values.level2 },
  ].flatMap(({ language: rawLanguage, level: rawLevel }) => {
    const language = optionalText(rawLanguage);
    const level = optionalText(rawLevel);
    return language && level ? [{ language, level }] : [];
  });
}

/** Renders a hydrated, grouped profile editor and private CV intake. */
export function Profile() {
  const t = useTranslations("profile");
  const common = useTranslations("common");
  const locale = useLocale() === "id" ? "id" : "en";
  const account = useQuery(api.accounts.current);
  const current = useQuery(api.profiles.get);
  const saveProfile = useSaveProfile(account?.userId);

  /** Validates one structured profile and persists it through Convex. */
  async function submit(values: ProfileFormValues) {
    const otherSkill = optionalText(values.otherSkill);
    const role = optionalText(values.role);
    const country = optionalText(values.country);
    const education = optionalText(values.education);
    const license = optionalText(values.license);
    const candidate = {
      desiredLocations: country ? [country] : [],
      desiredRoles: role ? [role] : [],
      documents: selectedValues(values.documents),
      education: education ? [education] : [],
      experienceYears: values.experience ?? 0,
      languages: selectedLanguages(values),
      licenses: license ? [license] : [],
      locale,
      pathways: selectedValues(values.pathways),
      skills: [
        ...selectedValues(values.skills),
        ...(otherSkill ? [otherSkill] : []),
      ],
      workAuthorization: values.workAuthorization,
      workModes: selectedValues(values.workModes),
    };
    const decoded = await Effect.runPromise(
      Schema.decodeUnknownEffect(ProfileInput)(candidate).pipe(Effect.option)
    );

    if (decoded._tag === "None") {
      toast.danger(common("error"));
      return false;
    }
    const saved = await saveProfile({
      ...decoded.value,
      desiredLocations: [...decoded.value.desiredLocations],
      desiredRoles: [...decoded.value.desiredRoles],
      documents: [...decoded.value.documents],
      education: [...decoded.value.education],
      languages: decoded.value.languages.map((item) => ({ ...item })),
      licenses: [...decoded.value.licenses],
      pathways: [...decoded.value.pathways],
      skills: [...decoded.value.skills],
      workModes: [...decoded.value.workModes],
    }).then(
      () => true,
      () => false
    );
    if (!saved) {
      toast.danger(common("error"));
      return false;
    }
    toast.success(t("saved"));
    return true;
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Header title={t("title")} />
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        <div className="mx-auto w-full max-w-[90rem] px-4 py-4 sm:px-6 sm:py-6">
          <ProfileForm
            current={current ?? null}
            disabled={current === undefined || account === undefined}
            key={`${current?._id ?? "new"}-${current?.updatedAt ?? 0}`}
            onSubmit={submit}
          />
        </div>
      </div>
    </section>
  );
}
