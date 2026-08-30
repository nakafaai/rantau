"use client";

import { SaveIcon } from "@hugeicons/core-free-icons";
import type { Doc } from "@repo/backend/convex/_generated/dataModel";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@repo/design-system/components/ui/field";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Input } from "@repo/design-system/components/ui/input";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@repo/design-system/components/ui/number-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { useTranslations } from "next-intl";
import { CountryFlag } from "@/components/country-flag";
import { countries, pathways, workModes } from "@/lib/options";
import {
  documentOptions,
  languageOptions,
  levelOptions,
  skillOptions,
} from "@/lib/profile";

type ProfileFormProps = Readonly<{
  current: Doc<"profiles"> | null;
  disabled: boolean;
  onSubmit: (formData: FormData) => Promise<void>;
  pending: boolean;
}>;

/** Renders one consistent save footer for a Shadcn settings card. */
function SettingsFooter({
  disabled,
  helper,
  label,
}: Readonly<{ disabled: boolean; helper: string; label: string }>) {
  return (
    <CardFooter className="justify-between gap-4">
      <p className="text-muted-foreground text-xs">{helper}</p>
      <Button disabled={disabled} size="sm" type="submit">
        <HugeIcons className="size-4" icon={SaveIcon} />
        {label}
      </Button>
    </CardFooter>
  );
}

/** Composes grouped Shadcn settings without leaking storage syntax. */
export function ProfileForm({
  current,
  disabled,
  onSubmit,
  pending,
}: ProfileFormProps) {
  const t = useTranslations("profile");
  const common = useTranslations("common");
  const languages = [
    { key: "primary", language: current?.languages[0], position: 1 },
    { key: "secondary", language: current?.languages[1], position: 2 },
  ] as const;
  const selectedDocuments = new Set(current?.documents ?? []);
  const selectedModes = new Set(current?.workModes ?? []);
  const selectedPathways = new Set(current?.pathways ?? []);
  const selectedSkills = new Set(current?.skills ?? []);

  return (
    <form
      action={onSubmit}
      aria-busy={disabled}
      className="space-y-6"
      inert={disabled}
    >
      <Card>
        <CardHeader className="border-b">
          <CardTitle>{t("preferences")}</CardTitle>
          <CardDescription>{t("preferencesHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
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
                        ? selectedPathways.has(pathway)
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
                    defaultChecked={current ? selectedModes.has(mode) : true}
                    id={`mode-${mode}`}
                    name="workModes"
                    value={mode}
                  />
                  <FieldLabel htmlFor={`mode-${mode}`}>{t(mode)}</FieldLabel>
                </Field>
              ))}
            </FieldGroup>
          </FieldSet>
        </CardContent>
        <SettingsFooter
          disabled={disabled || pending}
          helper={t("preferencesSaveHelp")}
          label={t("save")}
        />
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{t("background")}</CardTitle>
          <CardDescription>{t("backgroundHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <FieldSet>
            <FieldLegend>{t("experienceTitle")}</FieldLegend>
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
                <NumberField
                  defaultValue={current?.experienceYears ?? 0}
                  max={80}
                  min={0}
                  name="experience"
                  step={0.5}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement />
                    <NumberFieldInput id="experience" />
                    <NumberFieldIncrement />
                  </NumberFieldGroup>
                </NumberField>
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldLegend>{t("skills")}</FieldLegend>
            <FieldGroup data-slot="checkbox-group">
              {skillOptions.map((skill) => (
                <Field key={skill.value} orientation="horizontal">
                  <Checkbox
                    defaultChecked={selectedSkills.has(skill.value)}
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
            {languages.map(({ key, language, position }) => (
              <div className="grid gap-2 sm:grid-cols-2" key={key}>
                <Select
                  defaultValue={language?.language ?? ""}
                  name={`language${position}`}
                >
                  <SelectTrigger
                    aria-label={`${t("languages")} ${position}`}
                    className="w-full"
                  >
                    <SelectValue placeholder={t("languagePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <CountryFlag countryCode={option.countryCode} />
                        {t(`languageOptions.${option.key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  defaultValue={language?.level ?? ""}
                  name={`level${position}`}
                >
                  <SelectTrigger
                    aria-label={`${t("levelPlaceholder")} ${position}`}
                    className="w-full"
                  >
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
        </CardContent>
        <SettingsFooter
          disabled={disabled || pending}
          helper={t("backgroundSaveHelp")}
          label={t("save")}
        />
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{t("documents")}</CardTitle>
          <CardDescription>{t("documentsHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <FieldSet>
            <FieldLegend>{t("availableDocuments")}</FieldLegend>
            <FieldGroup data-slot="checkbox-group">
              {documentOptions.map((document) => (
                <Field key={document.value} orientation="horizontal">
                  <Checkbox
                    defaultChecked={selectedDocuments.has(document.value)}
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
        </CardContent>
        <SettingsFooter
          disabled={disabled || pending}
          helper={t("documentsSaveHelp")}
          label={t("save")}
        />
      </Card>
    </form>
  );
}
