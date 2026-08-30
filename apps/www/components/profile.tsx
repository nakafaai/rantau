"use client";

import { api } from "@repo/backend/convex/_generated/api";
import { ProfileInput, WorkAuthorization } from "@repo/domain/profile";
import { useMutation, useQuery } from "convex/react";
import { Effect, Option, Schema } from "effect";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Cv } from "@/components/cv";
import { ProfileForm } from "@/components/form";
import { Header } from "@/components/header";

/** Reads one trimmed optional text value from a browser form. */
function optionalText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim() || undefined;
}

/** Reads every checked value for one structured form group. */
function selectedValues(formData: FormData, name: string) {
  return formData.getAll(name).flatMap((value) => {
    const selected = String(value).trim();
    return selected ? [selected] : [];
  });
}

/** Reads the two visible language rows without exposing storage grammar. */
function selectedLanguages(formData: FormData) {
  return [1, 2].flatMap((index) => {
    const language = optionalText(formData, `language${index}`);
    const level = optionalText(formData, `level${index}`);
    return language && level ? [{ language, level }] : [];
  });
}

/** Renders a hydrated, grouped profile editor and private CV intake. */
export function Profile() {
  const t = useTranslations("profile");
  const common = useTranslations("common");
  const locale = useLocale() === "id" ? "id" : "en";
  const current = useQuery(api.profiles.get);
  const saveProfile = useMutation(api.profiles.upsert);
  const [pending, setPending] = useState(false);

  /** Validates one structured profile and persists it through Convex. */
  async function submit(formData: FormData) {
    const otherSkill = optionalText(formData, "otherSkill");
    const role = optionalText(formData, "role");
    const country = optionalText(formData, "country");
    const education = optionalText(formData, "education");
    const license = optionalText(formData, "license");
    const workAuthorization = Option.getOrUndefined(
      Schema.decodeUnknownOption(WorkAuthorization)(
        optionalText(formData, "workAuthorization")
      )
    );
    const candidate = {
      desiredLocations: country ? [country] : [],
      desiredRoles: role ? [role] : [],
      documents: selectedValues(formData, "documents"),
      education: education ? [education] : [],
      experienceYears: Number(formData.get("experience") ?? 0),
      languages: selectedLanguages(formData),
      licenses: license ? [license] : [],
      locale,
      pathways: selectedValues(formData, "pathways"),
      skills: [
        ...selectedValues(formData, "skills"),
        ...(otherSkill ? [otherSkill] : []),
      ],
      workAuthorization,
      workModes: selectedValues(formData, "workModes"),
    };
    const decoded = await Effect.runPromise(
      Schema.decodeUnknownEffect(ProfileInput)(candidate).pipe(Effect.option)
    );

    if (decoded._tag === "None") {
      toast.error(common("error"));
      return;
    }
    setPending(true);
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
    setPending(false);
    if (!saved) {
      toast.error(common("error"));
      return;
    }
    toast.success(t("saved"));
  }

  return (
    <section className="space-y-8">
      <Header title={t("title")} />
      <ProfileForm
        current={current ?? null}
        disabled={current === undefined}
        key={current?.updatedAt ?? "new"}
        onSubmit={submit}
        pending={pending}
      />
      <Cv current={current ?? null} disabled={current === undefined} />
    </section>
  );
}
