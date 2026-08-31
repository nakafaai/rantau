"use client";

import { SaveIcon } from "@hugeicons/core-free-icons";
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
import { CountryPicker } from "@/components/country-picker";
import { pathways, workModes } from "@/lib/options";
import {
  documentOptions,
  languageOptions,
  levelOptions,
  skillOptions,
} from "@/lib/profile";
import { profileFormOptions, withProfileForm } from "@/lib/profile-form";

/** Renders one consistent save footer driven by TanStack Form state. */
const SettingsFooter = withProfileForm({
  ...profileFormOptions,
  props: { disabled: false, helper: "", label: "" },
  render: ({ disabled, form, helper, label }) => (
    <CardFooter className="flex-wrap justify-between gap-4">
      <p className="text-muted-foreground text-sm">{helper}</p>
      <form.Subscribe
        selector={(state) => [
          state.canSubmit,
          state.isDefaultValue,
          state.isSubmitting,
        ]}
      >
        {([canSubmit, isDefaultValue, isSubmitting]) => (
          <Button
            disabled={disabled || !canSubmit || isDefaultValue || isSubmitting}
            size="sm"
            type="submit"
          >
            <HugeIcons className="size-4" icon={SaveIcon} />
            {label}
          </Button>
        )}
      </form.Subscribe>
    </CardFooter>
  ),
});

/** Renders job-search preferences with controlled Base UI fields. */
export const PreferencesCard = withProfileForm({
  ...profileFormOptions,
  props: { disabled: false },
  render: ({ disabled, form }) => {
    const t = useTranslations("profile");

    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>{t("preferences")}</CardTitle>
          <CardDescription>{t("preferencesHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <FieldGroup>
            <form.Field name="role">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>{t("roles")}</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder={t("rolesPlaceholder")}
                    value={field.state.value}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="country">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>{t("locations")}</FieldLabel>
                  <CountryPicker
                    disabled={disabled}
                    id={field.name}
                    onChange={(country) =>
                      field.handleChange(country?.name ?? "")
                    }
                    value={field.state.value}
                  />
                </Field>
              )}
            </form.Field>
          </FieldGroup>
          <form.Field mode="array" name="pathways">
            {(field) => (
              <FieldSet>
                <FieldLegend>{t("pathways")}</FieldLegend>
                <FieldGroup data-slot="checkbox-group">
                  {pathways.map((pathway) => (
                    <Field key={pathway} orientation="horizontal">
                      <Checkbox
                        checked={field.state.value.includes(pathway)}
                        id={`pathway-${pathway}`}
                        name={field.name}
                        onCheckedChange={(checked) => {
                          const index = field.state.value.indexOf(pathway);
                          if (checked && index < 0) {
                            field.pushValue(pathway);
                          } else if (!checked && index >= 0) {
                            field.removeValue(index);
                          }
                        }}
                        value={pathway}
                      />
                      <FieldLabel htmlFor={`pathway-${pathway}`}>
                        {t(pathway)}
                      </FieldLabel>
                    </Field>
                  ))}
                </FieldGroup>
              </FieldSet>
            )}
          </form.Field>
          <form.Field mode="array" name="workModes">
            {(field) => (
              <FieldSet>
                <FieldLegend>{t("workModes")}</FieldLegend>
                <FieldGroup data-slot="checkbox-group">
                  {workModes.map((mode) => (
                    <Field key={mode} orientation="horizontal">
                      <Checkbox
                        checked={field.state.value.includes(mode)}
                        id={`mode-${mode}`}
                        name={field.name}
                        onCheckedChange={(checked) => {
                          const index = field.state.value.indexOf(mode);
                          if (checked && index < 0) {
                            field.pushValue(mode);
                          } else if (!checked && index >= 0) {
                            field.removeValue(index);
                          }
                        }}
                        value={mode}
                      />
                      <FieldLabel htmlFor={`mode-${mode}`}>
                        {t(mode)}
                      </FieldLabel>
                    </Field>
                  ))}
                </FieldGroup>
              </FieldSet>
            )}
          </form.Field>
        </CardContent>
        <SettingsFooter
          disabled={disabled}
          form={form}
          helper={t("preferencesSaveHelp")}
          label={t("save")}
        />
      </Card>
    );
  },
});

/** Renders experience, skills, and language background fields. */
export const BackgroundCard = withProfileForm({
  ...profileFormOptions,
  props: { disabled: false },
  render: ({ disabled, form }) => {
    const t = useTranslations("profile");

    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>{t("background")}</CardTitle>
          <CardDescription>{t("backgroundHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <FieldSet>
            <FieldLegend>{t("experienceTitle")}</FieldLegend>
            <FieldGroup>
              <form.Field name="education">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("education")}
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder={t("educationPlaceholder")}
                      value={field.state.value}
                    />
                  </Field>
                )}
              </form.Field>
              <form.Field name="experience">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("experience")}
                    </FieldLabel>
                    <NumberField
                      id={field.name}
                      max={80}
                      min={0}
                      name={field.name}
                      onValueChange={field.handleChange}
                      step={0.5}
                      value={field.state.value}
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </FieldSet>
          <form.Field mode="array" name="skills">
            {(field) => (
              <FieldSet>
                <FieldLegend>{t("skills")}</FieldLegend>
                <FieldGroup data-slot="checkbox-group">
                  {skillOptions.map((skill) => (
                    <Field key={skill.value} orientation="horizontal">
                      <Checkbox
                        checked={field.state.value.includes(skill.value)}
                        id={`skill-${skill.key}`}
                        name={field.name}
                        onCheckedChange={(checked) => {
                          const index = field.state.value.indexOf(skill.value);
                          if (checked && index < 0) {
                            field.pushValue(skill.value);
                          } else if (!checked && index >= 0) {
                            field.removeValue(index);
                          }
                        }}
                        value={skill.value}
                      />
                      <FieldLabel htmlFor={`skill-${skill.key}`}>
                        {t(`skillOptions.${skill.key}`)}
                      </FieldLabel>
                    </Field>
                  ))}
                </FieldGroup>
              </FieldSet>
            )}
          </form.Field>
          <form.Field name="otherSkill">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>{t("otherSkill")}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder={t("skillPlaceholder")}
                  value={field.state.value}
                />
              </Field>
            )}
          </form.Field>
          <FieldSet>
            <FieldLegend>{t("languages")}</FieldLegend>
            {[1, 2].map((position) => (
              <div className="grid gap-2 sm:grid-cols-2" key={position}>
                <form.Field name={position === 1 ? "language1" : "language2"}>
                  {(field) => (
                    <Select
                      name={field.name}
                      onValueChange={(value) => field.handleChange(value ?? "")}
                      value={field.state.value}
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
                  )}
                </form.Field>
                <form.Field name={position === 1 ? "level1" : "level2"}>
                  {(field) => (
                    <Select
                      name={field.name}
                      onValueChange={(value) => field.handleChange(value ?? "")}
                      value={field.state.value}
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
                  )}
                </form.Field>
              </div>
            ))}
          </FieldSet>
        </CardContent>
        <SettingsFooter
          disabled={disabled}
          form={form}
          helper={t("backgroundSaveHelp")}
          label={t("save")}
        />
      </Card>
    );
  },
});

/** Renders documents and work authorization fields. */
export const DocumentsCard = withProfileForm({
  ...profileFormOptions,
  props: { disabled: false },
  render: ({ disabled, form }) => {
    const t = useTranslations("profile");

    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>{t("documents")}</CardTitle>
          <CardDescription>{t("documentsHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <form.Field mode="array" name="documents">
            {(field) => (
              <FieldSet>
                <FieldLegend>{t("availableDocuments")}</FieldLegend>
                <FieldGroup data-slot="checkbox-group">
                  {documentOptions.map((document) => (
                    <Field key={document.value} orientation="horizontal">
                      <Checkbox
                        checked={field.state.value.includes(document.value)}
                        id={`document-${document.key}`}
                        name={field.name}
                        onCheckedChange={(checked) => {
                          const index = field.state.value.indexOf(
                            document.value
                          );
                          if (checked && index < 0) {
                            field.pushValue(document.value);
                          } else if (!checked && index >= 0) {
                            field.removeValue(index);
                          }
                        }}
                        value={document.value}
                      />
                      <FieldLabel htmlFor={`document-${document.key}`}>
                        {t(`documentOptions.${document.key}`)}
                      </FieldLabel>
                    </Field>
                  ))}
                </FieldGroup>
              </FieldSet>
            )}
          </form.Field>
          <form.Field name="license">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>{t("licenses")}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder={t("licensePlaceholder")}
                  value={field.state.value}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="workAuthorization">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  {t("workAuthorization")}
                </FieldLabel>
                <Select
                  name={field.name}
                  onValueChange={(value) =>
                    field.handleChange(value ?? "unsure")
                  }
                  value={field.state.value}
                >
                  <SelectTrigger className="w-full" id={field.name}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="authorized">
                      {t("authorized")}
                    </SelectItem>
                    <SelectItem value="sponsorship">
                      {t("sponsorship")}
                    </SelectItem>
                    <SelectItem value="unsure">{t("unsure")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>
        </CardContent>
        <SettingsFooter
          disabled={disabled}
          form={form}
          helper={t("documentsSaveHelp")}
          label={t("save")}
        />
      </Card>
    );
  },
});
