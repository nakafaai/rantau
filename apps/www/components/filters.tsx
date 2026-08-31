"use client";

import { Button, Chip, Drawer, Label, ListBox, Select } from "@heroui/react";
import { Cancel01Icon, FilterAddIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { CountryFlag } from "@/components/country-flag";
import { LocationFields, type PlaceDraft } from "@/components/location-fields";
import { pathways, workModes } from "@/lib/options";

export type FilterValue = PlaceDraft &
  Readonly<{
    pathway: Pathway | "";
    workMode: WorkMode | "";
  }>;

type FiltersProps = Readonly<{
  onChange: (value: FilterValue) => void;
  value: FilterValue;
}>;

type Pathway = (typeof pathways)[number];
type WorkMode = (typeof workModes)[number];

/** Renders advanced filters with a committed chip summary. */
export function Filters({ onChange, value }: FiltersProps) {
  const t = useTranslations("search");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  /** Opens the sheet from the last committed filter state. */
  function changeOpen(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(value);
    }
    setOpen(nextOpen);
  }

  /** Commits every related location and opportunity filter together. */
  function apply() {
    onChange(draft);
    setOpen(false);
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Button onPress={() => changeOpen(true)} size="sm" variant="tertiary">
        <HugeiconsIcon
          className="size-4"
          icon={FilterAddIcon}
          strokeWidth={2}
        />
        {t("addFilter")}
      </Button>
      <Drawer.Backdrop isOpen={open} onOpenChange={changeOpen}>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="w-full sm:max-w-md">
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>{t("advancedFilters")}</Drawer.Heading>
              <p className="text-muted text-sm">{t("advancedFiltersHelp")}</p>
            </Drawer.Header>
            <Drawer.Body className="space-y-6">
              <LocationFields
                onChange={(place) => setDraft({ ...draft, ...place })}
                value={draft}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  fullWidth
                  onChange={(key) =>
                    setDraft({
                      ...draft,
                      pathway:
                        pathways.find((pathway) => pathway === key) ?? "",
                    })
                  }
                  placeholder={t("anyPathway")}
                  value={draft.pathway || null}
                  variant="secondary"
                >
                  <Label>{t("pathway")}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {pathways.map((pathway) => (
                        <ListBox.Item
                          id={pathway}
                          key={pathway}
                          textValue={t(pathway)}
                        >
                          {t(pathway)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
                <Select
                  fullWidth
                  onChange={(key) =>
                    setDraft({
                      ...draft,
                      workMode:
                        workModes.find((workMode) => workMode === key) ?? "",
                    })
                  }
                  placeholder={t("anyWorkMode")}
                  value={draft.workMode || null}
                  variant="secondary"
                >
                  <Label>{t("workMode")}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {workModes.map((workMode) => (
                        <ListBox.Item
                          id={workMode}
                          key={workMode}
                          textValue={t(workMode)}
                        >
                          {t(workMode)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            </Drawer.Body>
            <Drawer.Footer className="justify-between">
              <Button
                onPress={() =>
                  setDraft({
                    city: "",
                    country: "",
                    countryCode: "",
                    pathway: "",
                    region: "",
                    regionCode: "",
                    workMode: "",
                  })
                }
                type="button"
                variant="tertiary"
              >
                {t("clearAll")}
              </Button>
              <Button onPress={apply} type="button">
                {t("applyFilters")}
              </Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      {value.country ? (
        <FilterChip
          icon={
            value.countryCode ? (
              <CountryFlag countryCode={value.countryCode} />
            ) : null
          }
          label={t("country")}
          onClear={() =>
            onChange({
              ...value,
              city: "",
              country: "",
              countryCode: "",
              region: "",
              regionCode: "",
            })
          }
          value={value.country}
        />
      ) : null}
      {value.region ? (
        <FilterChip
          label={t("regionShort")}
          onClear={() =>
            onChange({ ...value, city: "", region: "", regionCode: "" })
          }
          value={value.region}
        />
      ) : null}
      {value.city ? (
        <FilterChip
          label={t("city")}
          onClear={() => onChange({ ...value, city: "" })}
          value={value.city}
        />
      ) : null}
      {value.pathway ? (
        <FilterChip
          label={t("pathway")}
          onClear={() => onChange({ ...value, pathway: "" })}
          value={t(value.pathway)}
        />
      ) : null}
      {value.workMode ? (
        <FilterChip
          label={t("workMode")}
          onClear={() => onChange({ ...value, workMode: "" })}
          value={t(value.workMode)}
        />
      ) : null}
    </div>
  );
}

/** Renders one clearable applied-filter chip. */
function FilterChip({
  icon,
  label,
  onClear,
  value,
}: Readonly<{
  icon?: ReactNode;
  label: string;
  onClear: () => void;
  value: string;
}>) {
  return (
    <Chip className="max-w-full gap-1.5" size="sm" variant="secondary">
      {icon}
      <span className="shrink-0 text-muted">{label}</span>
      <Chip.Label className="max-w-40 truncate">{value}</Chip.Label>
      <Button
        aria-label={`${label}: ${value}`}
        className="-me-1 size-6 min-w-6 rounded-full"
        isIconOnly
        onPress={onClear}
        size="sm"
        type="button"
        variant="ghost"
      >
        <HugeiconsIcon
          className="size-3.5"
          icon={Cancel01Icon}
          strokeWidth={2}
        />
      </Button>
    </Chip>
  );
}
