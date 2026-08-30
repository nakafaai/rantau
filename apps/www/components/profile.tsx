"use client";

import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { ProfileInput } from "@repo/domain/profile";
import { useAction, useMutation, useQuery } from "convex/react";
import { Effect, Schema } from "effect";
import { FileText, Save, Upload } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";

/** Splits a comma-delimited form value into concise nonempty values. */
function split(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Converts language entries such as German:B1 into structured levels. */
function languages(value: FormDataEntryValue | null) {
  return split(value).map((entry) => {
    const [language = entry, level = "unspecified"] = entry.split(":");
    return { language: language.trim(), level: level.trim() };
  });
}

/** Captures job preferences and privately extracts an optional PDF CV. */
export function Profile() {
  const t = useTranslations("profile");
  const common = useTranslations("common");
  const locale = useLocale() === "id" ? "id" : "en";
  const current = useQuery(api.profiles.get);
  const saveProfile = useMutation(api.profiles.upsert);
  const createUpload = useMutation(api.profiles.uploadUrl);
  const attachCv = useMutation(api.profiles.attachCv);
  const extractCv = useAction(api.cv.extract);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [cvPending, setCvPending] = useState(false);

  /** Validates and persists profile values through the Effect schema. */
  async function submit(formData: FormData) {
    setPending(true);
    const candidate = {
      desiredLocations: split(formData.get("locations")),
      desiredRoles: split(formData.get("roles")),
      documents: split(formData.get("documents")),
      education: split(formData.get("education")),
      experienceYears: Number(formData.get("experience") ?? 0),
      languages: languages(formData.get("languages")),
      licenses: split(formData.get("licenses")),
      locale,
      pathways: ["job", "ausbildung", "apprenticeship", "vocational"],
      skills: split(formData.get("skills")),
      visaNotes: String(formData.get("visa") ?? "").trim() || undefined,
      workModes: ["onsite", "hybrid", "remote"],
    };
    const decoded = await Effect.runPromise(
      Schema.decodeUnknownEffect(ProfileInput)(candidate).pipe(Effect.option)
    );
    try {
      if (decoded._tag === "None") {
        throw new Error("Invalid profile");
      }
      await saveProfile({
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
      });
      toast.success(t("saved"));
    } catch {
      toast.error(common("error"));
    } finally {
      setPending(false);
    }
  }

  /** Uploads, attaches, and extracts one PDF owned by the current user. */
  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (file?.type !== "application/pdf" || file.size > 5 * 1024 * 1024) {
      toast.error(t("cvHelp"));
      return;
    }
    setCvPending(true);
    try {
      const uploadUrl = await createUpload();
      const response = await fetch(uploadUrl, {
        body: file,
        headers: { "Content-Type": file.type },
        method: "POST",
      });
      const payload = (await response.json()) as { storageId: Id<"_storage"> };
      await attachCv({ fileId: payload.storageId, fileName: file.name });
      await extractCv({ fileId: payload.storageId });
      toast.success(t("uploaded"));
    } catch {
      toast.error(common("error"));
    } finally {
      setCvPending(false);
    }
  }

  return (
    <section className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <p className="font-semibold text-primary text-sm uppercase tracking-[0.16em]">
          {t("eyebrow")}
        </p>
        <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {t("description")}
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("comma")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={submit} className="grid gap-5 sm:grid-cols-2">
              {[
                ["roles", t("roles"), current?.desiredRoles],
                ["locations", t("locations"), current?.desiredLocations],
                ["skills", t("skills"), current?.skills],
                ["education", t("education"), current?.education],
                ["documents", t("documents"), current?.documents],
                ["licenses", t("licenses"), current?.licenses],
              ].map(([name, label, values]) => (
                <label
                  className="grid gap-2 font-medium text-sm"
                  htmlFor={String(name)}
                  key={String(name)}
                >
                  {label}
                  <Input
                    defaultValue={
                      Array.isArray(values) ? values.join(", ") : ""
                    }
                    id={String(name)}
                    name={String(name)}
                  />
                </label>
              ))}
              <label
                className="grid gap-2 font-medium text-sm"
                htmlFor="languages"
              >
                {t("languages")}
                <Input
                  defaultValue={current?.languages
                    .map((item) => `${item.language}:${item.level}`)
                    .join(", ")}
                  id="languages"
                  name="languages"
                  placeholder="German:B1, English:B2"
                />
              </label>
              <label
                className="grid gap-2 font-medium text-sm"
                htmlFor="experience"
              >
                {t("experience")}
                <Input
                  defaultValue={current?.experienceYears ?? 0}
                  id="experience"
                  min="0"
                  name="experience"
                  step="0.5"
                  type="number"
                />
              </label>
              <label
                className="grid gap-2 font-medium text-sm sm:col-span-2"
                htmlFor="visa"
              >
                {t("visa")}
                <Textarea
                  defaultValue={current?.visaNotes ?? ""}
                  id="visa"
                  name="visa"
                />
              </label>
              <Button
                className="sm:col-span-2 sm:w-fit"
                disabled={pending}
                type="submit"
              >
                <Save /> {t("save")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <div className="mb-2 grid size-10 place-items-center rounded-full bg-secondary text-primary">
              <FileText className="size-5" />
            </div>
            <CardTitle>{t("cv")}</CardTitle>
            <CardDescription>{t("cvHelp")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {current?.cvFileName ? (
              <p className="rounded-lg bg-muted p-3 font-medium text-sm">
                {current.cvFileName}
              </p>
            ) : null}
            <Input accept="application/pdf" ref={fileRef} type="file" />
            <Button
              className="w-full"
              disabled={cvPending || !current}
              onClick={upload}
            >
              <Upload /> {t("upload")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
