"use client";

import {
  Card,
  Checkbox,
  CheckboxGroup,
  FieldGroup,
  Fieldset,
  Input,
  type Key,
  Label,
  ListBox,
  NumberField,
  Select,
  TextField,
} from "@heroui/react";
import { useTranslations } from "next-intl";
import { CountryFlag } from "@/components/country-flag";
import { CountryPicker } from "@/components/country-picker";
import { SettingsFooter } from "@/components/settings-footer";
import { pathways, workModes } from "@/lib/options";
import {
  documentOptions,
  languageOptions,
  levelOptions,
  skillOptions,
} from "@/lib/profile";
import { profileFormOptions, withProfileForm } from "@/lib/profile-form";

/** Keeps only values that belong to the schema-owned option list. */
function selectKnown<Option extends string>(
  values: readonly string[],
  options: readonly Option[]
): Option[] {
  const selected = new Set(values);
  return options.filter((option) => selected.has(option));
}

/** Renders job-search preferences with controlled HeroUI fields. */
export const PreferencesCard = withProfileForm({
  ...profileFormOptions,
  props: { disabled: false },
  render: ({ disabled, form }) => {
    const t = useTranslations("profile");

    return (
      <Card className="lg:col-span-2">
        <Card.Header>
          <Card.Title>{t("preferences")}</Card.Title>
        </Card.Header>
        <Card.Content className="gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <form.Field name="role">
              {(field) => (
                <TextField name={field.name}>
                  <Label>{t("roles")}</Label>
                  <Input
                    id={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder={t("roles-placeholder")}
                    value={field.state.value}
                    variant="secondary"
                  />
                </TextField>
              )}
            </form.Field>
            <form.Field name="country">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>{t("locations")}</Label>
                  <CountryPicker
                    disabled={disabled}
                    id={field.name}
                    onChange={(country) =>
                      field.handleChange(country?.name ?? "")
                    }
                    value={field.state.value}
                  />
                </div>
              )}
            </form.Field>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <form.Field mode="array" name="pathways">
              {(field) => (
                <CheckboxGroup
                  name={field.name}
                  onChange={(values) =>
                    field.handleChange(selectKnown(values, pathways))
                  }
                  value={field.state.value}
                  variant="secondary"
                >
                  <Label>{t("pathways")}</Label>
                  {pathways.map((pathway) => (
                    <Checkbox key={pathway} value={pathway}>
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        {t(pathway)}
                      </Checkbox.Content>
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              )}
            </form.Field>

            <form.Field mode="array" name="workModes">
              {(field) => (
                <CheckboxGroup
                  name={field.name}
                  onChange={(values) =>
                    field.handleChange(selectKnown(values, workModes))
                  }
                  value={field.state.value}
                  variant="secondary"
                >
                  <Label>{t("work-modes")}</Label>
                  {workModes.map((mode) => (
                    <Checkbox key={mode} value={mode}>
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        {t(mode)}
                      </Checkbox.Content>
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              )}
            </form.Field>
          </div>
        </Card.Content>
        <SettingsFooter
          disabled={disabled}
          form={form}
          helper={t("preferences-save-help")}
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
        <Card.Header>
          <Card.Title>{t("background")}</Card.Title>
          <Card.Description>{t("background-help")}</Card.Description>
        </Card.Header>
        <Card.Content className="gap-4">
          <Fieldset>
            <Fieldset.Legend>{t("experience-title")}</Fieldset.Legend>
            <FieldGroup>
              <form.Field name="education">
                {(field) => (
                  <TextField name={field.name}>
                    <Label>{t("education")}</Label>
                    <Input
                      id={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder={t("education-placeholder")}
                      value={field.state.value}
                      variant="secondary"
                    />
                  </TextField>
                )}
              </form.Field>
              <form.Field name="experience">
                {(field) => (
                  <NumberField
                    id={field.name}
                    isDisabled={disabled}
                    maxValue={80}
                    minValue={0}
                    name={field.name}
                    onChange={field.handleChange}
                    step={0.5}
                    value={field.state.value ?? undefined}
                    variant="secondary"
                  >
                    <Label>{t("experience")}</Label>
                    <NumberField.Group>
                      <NumberField.DecrementButton />
                      <NumberField.Input />
                      <NumberField.IncrementButton />
                    </NumberField.Group>
                  </NumberField>
                )}
              </form.Field>
            </FieldGroup>
          </Fieldset>

          <form.Field mode="array" name="skills">
            {(field) => (
              <CheckboxGroup
                name={field.name}
                onChange={(values) => field.handleChange(values)}
                value={field.state.value}
                variant="secondary"
              >
                <Label>{t("skills")}</Label>
                {skillOptions.map((skill) => (
                  <Checkbox key={skill.value} value={skill.value}>
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      {t(`skill-options.${skill.key}`)}
                    </Checkbox.Content>
                  </Checkbox>
                ))}
              </CheckboxGroup>
            )}
          </form.Field>

          <form.Field name="otherSkill">
            {(field) => (
              <TextField name={field.name}>
                <Label>{t("other-skill")}</Label>
                <Input
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder={t("skill-placeholder")}
                  value={field.state.value}
                  variant="secondary"
                />
              </TextField>
            )}
          </form.Field>

          <Fieldset>
            <Fieldset.Legend>{t("languages")}</Fieldset.Legend>
            <div className="space-y-3">
              {[1, 2].map((position) => (
                <div className="grid gap-3 sm:grid-cols-2" key={position}>
                  <form.Field name={position === 1 ? "language1" : "language2"}>
                    {(field) => (
                      <Select
                        aria-label={`${t("languages")} ${position}`}
                        name={field.name}
                        onChange={(key: Key | null) =>
                          field.handleChange(key === null ? "" : String(key))
                        }
                        placeholder={t("language-placeholder")}
                        value={field.state.value || null}
                        variant="secondary"
                      >
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {languageOptions.map((option) => (
                              <ListBox.Item
                                id={option.value}
                                key={option.value}
                                textValue={t(`language-options.${option.key}`)}
                              >
                                <CountryFlag countryCode={option.countryCode} />
                                {t(`language-options.${option.key}`)}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    )}
                  </form.Field>
                  <form.Field name={position === 1 ? "level1" : "level2"}>
                    {(field) => (
                      <Select
                        aria-label={`${t("level-placeholder")} ${position}`}
                        name={field.name}
                        onChange={(key: Key | null) =>
                          field.handleChange(key === null ? "" : String(key))
                        }
                        placeholder={t("level-placeholder")}
                        value={field.state.value || null}
                        variant="secondary"
                      >
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {levelOptions.map((level) => (
                              <ListBox.Item
                                id={level}
                                key={level}
                                textValue={level}
                              >
                                {level}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    )}
                  </form.Field>
                </div>
              ))}
            </div>
          </Fieldset>
        </Card.Content>
        <SettingsFooter
          disabled={disabled}
          form={form}
          helper={t("background-save-help")}
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
        <Card.Header>
          <Card.Title>{t("documents")}</Card.Title>
          <Card.Description>{t("documents-help")}</Card.Description>
        </Card.Header>
        <Card.Content className="gap-4">
          <form.Field mode="array" name="documents">
            {(field) => (
              <CheckboxGroup
                name={field.name}
                onChange={(values) => field.handleChange(values)}
                value={field.state.value}
                variant="secondary"
              >
                <Label>{t("available-documents")}</Label>
                {documentOptions.map((document) => (
                  <Checkbox key={document.value} value={document.value}>
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      {t(`document-options.${document.key}`)}
                    </Checkbox.Content>
                  </Checkbox>
                ))}
              </CheckboxGroup>
            )}
          </form.Field>

          <form.Field name="license">
            {(field) => (
              <TextField name={field.name}>
                <Label>{t("licenses")}</Label>
                <Input
                  id={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder={t("license-placeholder")}
                  value={field.state.value}
                  variant="secondary"
                />
              </TextField>
            )}
          </form.Field>

          <form.Field name="workAuthorization">
            {(field) => (
              <Select
                aria-label={t("work-authorization")}
                name={field.name}
                onChange={(key: Key | null) => {
                  const value = key === null ? "" : String(key);
                  if (
                    value === "authorized" ||
                    value === "sponsorship" ||
                    value === "unsure"
                  ) {
                    field.handleChange(value);
                  }
                }}
                placeholder={t("unsure")}
                value={field.state.value || null}
                variant="secondary"
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {(["authorized", "sponsorship", "unsure"] as const).map(
                      (value) => (
                        <ListBox.Item
                          id={value}
                          key={value}
                          textValue={t(value)}
                        >
                          {t(value)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      )
                    )}
                  </ListBox>
                </Select.Popover>
              </Select>
            )}
          </form.Field>
        </Card.Content>
        <SettingsFooter
          disabled={disabled}
          form={form}
          helper={t("documents-save-help")}
          label={t("save")}
        />
      </Card>
    );
  },
});
