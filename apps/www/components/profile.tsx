"use client";

import { SaveIcon, Upload02Icon } from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import type { Doc, Id } from "@repo/backend/convex/_generated/dataModel";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@repo/design-system/components/ui/field";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { ProfileInput, WorkAuthorization } from "@repo/domain/profile";
import { useAction, useMutation, useQuery } from "convex/react";
import { Effect, Option, Schema } from "effect";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CountryFlag } from "@/components/country-flag";
import { Header } from "@/components/header";
import { countries, pathways, workModes } from "@/lib/options";

const skillOptions = [
  { key: "customerService", value: "Customer service" },
  { key: "healthcare", value: "Healthcare" },
  { key: "hospitality", value: "Hospitality" },
  { key: "logistics", value: "Logistics" },
  { key: "software", value: "Software" },
  { key: "welding", value: "Welding" },
] as const;
const documentOptions = [
  { key: "passport", value: "Passport" },
  { key: "diploma", value: "Diploma" },
  { key: "driverLicense", value: "Driver license" },
  { key: "languageCertificate", value: "Language certificate" },
] as const;
const languageOptions = [
  { key: "english", value: "English" },
  { key: "german", value: "German" },
  { key: "indonesian", value: "Indonesian" },
  { key: "japanese", value: "Japanese" },
  { key: "french", value: "French" },
] as const;
const levelOptions = ["A1", "A2", "B1", "B2", "C1", "C2", "Native"] as const;
const profileSkeletonFields = [
  "identity",
  "destination",
  "pathway",
  "experience",
  "skills",
  "languages",
] as const;

/** Reads one trimmed optional text value from a browser form. */
function optionalText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim() || undefined;
}

/** Reads every checked value for one structured form group. */
function selectedValues(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .map(String)
    .map((value) => value.trim())
    .filter(Boolean);
}

/** Reads the two visible language rows without exposing storage grammar. */
function selectedLanguages(formData: FormData) {
  return [1, 2].flatMap((index) => {
    const language = optionalText(formData, `language${index}`);
    const level = optionalText(formData, `level${index}`);
    return language && level ? [{ language, level }] : [];
  });
}

/** Renders a hydrated one-column profile editor and private CV intake. */
export function Profile() {
  const t = useTranslations("profile");
  const common = useTranslations("common");
  const locale = useLocale() === "id" ? "id" : "en";
  const current = useQuery(api.profiles.get);
  const saveProfile = useMutation(api.profiles.upsert);
  const createUpload = useMutation(api.profiles.uploadUrl);
  const extractCv = useAction(api.cv.extract);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [cvPending, setCvPending] = useState(false);

  /** Validates one structured profile and persists it through Convex. */
  async function submit(formData: FormData) {
    setPending(true);
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
      await extractCv({ fileId: payload.storageId, fileName: file.name });
      toast.success(t("uploaded"));
    } catch {
      toast.error(common("error"));
    } finally {
      setCvPending(false);
    }
  }

  return (
    <section className="space-y-8">
      <Header title={t("title")} />
      {current === undefined ? (
        <ProfileSkeleton />
      ) : (
        <ProfileForm
          current={current}
          key={current?._id ?? "new"}
          onSubmit={submit}
          pending={pending}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("cv")}</CardTitle>
          <CardDescription>{t("cvHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {current?.cvFileName ? (
            <p className="rounded-md bg-muted p-3 font-medium text-sm">
              {current.cvFileName}
            </p>
          ) : null}
          <Input accept="application/pdf" ref={fileRef} type="file" />
          <Button
            disabled={cvPending || !current}
            onClick={upload}
            variant="outline"
          >
            <HugeIcons className="size-4" icon={Upload02Icon} />
            {t("upload")}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

type ProfileFormProps = Readonly<{
  current: Doc<"profiles"> | null;
  onSubmit: (formData: FormData) => Promise<void>;
  pending: boolean;
}>;

/** Composes structured shadcn controls without leaking storage syntax. */
function ProfileForm({ current, onSubmit, pending }: ProfileFormProps) {
  const t = useTranslations("profile");
  const common = useTranslations("common");
  const firstLanguage = current?.languages[0];
  const secondLanguage = current?.languages[1];
  const languageRows = [
    { key: "primary", language: firstLanguage, position: 1 },
    { key: "secondary", language: secondLanguage, position: 2 },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("preferences")}</CardTitle>
        <CardDescription>{t("preferencesHelp")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-8">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="role">{t("roles")}</FieldLabel>
              <Input
                defaultValue={current?.desiredRoles[0] ?? ""}
                id="role"
                name="role"
                placeholder={t("rolesPlaceholder")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="country">{t("locations")}</FieldLabel>
              <Select
                defaultValue={current?.desiredLocations[0] ?? ""}
                name="country"
              >
                <SelectTrigger className="w-full" id="country">
                  <SelectValue placeholder={t("locationsPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.value}>
                      <CountryFlag countryCode={country.code} />
                      {common(`countries.${country.code}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <FieldSet>
            <FieldLegend>{t("pathways")}</FieldLegend>
            <FieldGroup data-slot="checkbox-group">
              {pathways.map((pathway) => (
                <Field key={pathway} orientation="horizontal">
                  <Checkbox
                    defaultChecked={
                      current
                        ? current.pathways.includes(pathway)
                        : pathway === "job"
                    }
                    id={`pathway-${pathway}`}
                    name="pathways"
                    value={pathway}
                  />
                  <FieldLabel htmlFor={`pathway-${pathway}`}>
                    {t(pathway)}
                  </FieldLabel>
                </Field>
              ))}
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>{t("workModes")}</FieldLegend>
            <FieldGroup data-slot="checkbox-group">
              {workModes.map((mode) => (
                <Field key={mode} orientation="horizontal">
                  <Checkbox
                    defaultChecked={current?.workModes.includes(mode) ?? true}
                    id={`mode-${mode}`}
                    name="workModes"
                    value={mode}
                  />
                  <FieldLabel htmlFor={`mode-${mode}`}>{t(mode)}</FieldLabel>
                </Field>
              ))}
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>{t("background")}</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="education">{t("education")}</FieldLabel>
                <Input
                  defaultValue={current?.education[0] ?? ""}
                  id="education"
                  name="education"
                  placeholder={t("educationPlaceholder")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="experience">{t("experience")}</FieldLabel>
                <Input
                  defaultValue={current?.experienceYears ?? 0}
                  id="experience"
                  min="0"
                  name="experience"
                  step="0.5"
                  type="number"
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>{t("skills")}</FieldLegend>
            <FieldGroup data-slot="checkbox-group">
              {skillOptions.map((skill) => (
                <Field key={skill.value} orientation="horizontal">
                  <Checkbox
                    defaultChecked={
                      current?.skills.includes(skill.value) ?? false
                    }
                    id={`skill-${skill.key}`}
                    name="skills"
                    value={skill.value}
                  />
                  <FieldLabel htmlFor={`skill-${skill.key}`}>
                    {t(`skillOptions.${skill.key}`)}
                  </FieldLabel>
                </Field>
              ))}
            </FieldGroup>
            <Field>
              <FieldLabel htmlFor="otherSkill">{t("otherSkill")}</FieldLabel>
              <Input
                id="otherSkill"
                name="otherSkill"
                placeholder={t("skillPlaceholder")}
              />
            </Field>
          </FieldSet>

          <FieldSet>
            <FieldLegend>{t("languages")}</FieldLegend>
            {languageRows.map(({ key, language, position }) => (
              <div className="grid gap-2 sm:grid-cols-2" key={key}>
                <Select
                  defaultValue={language?.language ?? ""}
                  name={`language${position}`}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("languagePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(`languageOptions.${option.key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  defaultValue={language?.level ?? ""}
                  name={`level${position}`}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("levelPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </FieldSet>

          <FieldSet>
            <FieldLegend>{t("documents")}</FieldLegend>
            <FieldDescription>{t("documentsHelp")}</FieldDescription>
            <FieldGroup data-slot="checkbox-group">
              {documentOptions.map((document) => (
                <Field key={document.value} orientation="horizontal">
                  <Checkbox
                    defaultChecked={
                      current?.documents.includes(document.value) ?? false
                    }
                    id={`document-${document.key}`}
                    name="documents"
                    value={document.value}
                  />
                  <FieldLabel htmlFor={`document-${document.key}`}>
                    {t(`documentOptions.${document.key}`)}
                  </FieldLabel>
                </Field>
              ))}
            </FieldGroup>
            <Field>
              <FieldLabel htmlFor="license">{t("licenses")}</FieldLabel>
              <Input
                defaultValue={current?.licenses[0] ?? ""}
                id="license"
                name="license"
                placeholder={t("licensePlaceholder")}
              />
            </Field>
          </FieldSet>

          <Field>
            <FieldLabel htmlFor="workAuthorization">
              {t("workAuthorization")}
            </FieldLabel>
            <Select
              defaultValue={current?.workAuthorization ?? "unsure"}
              name="workAuthorization"
            >
              <SelectTrigger className="w-full" id="workAuthorization">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="authorized">{t("authorized")}</SelectItem>
                <SelectItem value="sponsorship">{t("sponsorship")}</SelectItem>
                <SelectItem value="unsure">{t("unsure")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Button disabled={pending} type="submit">
            <HugeIcons className="size-4" icon={SaveIcon} />
            {t("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/** Preserves the vertical profile layout until Convex hydration completes. */
function ProfileSkeleton() {
  return (
    <Card aria-hidden>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-5">
        {profileSkeletonFields.map((field) => (
          <Skeleton className="h-9 w-full" key={field} />
        ))}
      </CardContent>
    </Card>
  );
}
