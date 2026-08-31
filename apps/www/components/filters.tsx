"use client";

import { Cancel01Icon, FilterAddIcon } from "@hugeicons/core-free-icons";
import { Button } from "@repo/design-system/components/ui/button";
import { Field, FieldLabel } from "@repo/design-system/components/ui/field";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/design-system/components/ui/sheet";
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
  disabled: boolean;
  onChange: (value: FilterValue) => void;
  value: FilterValue;
}>;

type Pathway = (typeof pathways)[number];
type WorkMode = (typeof workModes)[number];

/** Renders advanced filters with a committed chip summary. */
export function Filters({ disabled, onChange, value }: FiltersProps) {
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
      <Sheet onOpenChange={changeOpen} open={open}>
        <SheetTrigger
          disabled={disabled}
          render={
            <Button className="rounded-full" size="sm" variant="outline" />
          }
        >
          <HugeIcons className="size-4" icon={FilterAddIcon} />
          {t("addFilter")}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="shrink-0 border-b pr-12">
            <SheetTitle>{t("advancedFilters")}</SheetTitle>
            <SheetDescription>{t("advancedFiltersHelp")}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
            <LocationFields
              disabled={disabled}
              onChange={(place) => setDraft({ ...draft, ...place })}
              value={draft}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>{t("pathway")}</FieldLabel>
                <Select
                  onValueChange={(pathway) =>
                    setDraft({ ...draft, pathway: pathway ?? "" })
                  }
                  value={draft.pathway || null}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("anyPathway")} />
                  </SelectTrigger>
                  <SelectContent>
                    {pathways.map((pathway) => (
                      <SelectItem key={pathway} value={pathway}>
                        {t(pathway)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>{t("workMode")}</FieldLabel>
                <Select
                  onValueChange={(workMode) =>
                    setDraft({ ...draft, workMode: workMode ?? "" })
                  }
                  value={draft.workMode || null}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("anyWorkMode")} />
                  </SelectTrigger>
                  <SelectContent>
                    {workModes.map((workMode) => (
                      <SelectItem key={workMode} value={workMode}>
                        {t(workMode)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <p className="text-muted-foreground text-sm">
              {t.rich("geographyAttribution", {
                link: (children) => (
                  <a
                    className="underline underline-offset-4"
                    href="https://github.com/dr5hn/countrystatecity-npm"
                    rel="noreferrer"
                    target="_blank"
                  >
                    {children}
                  </a>
                ),
              })}
            </p>
          </div>
          <SheetFooter className="shrink-0 flex-row justify-between border-t">
            <Button
              onClick={() =>
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
              variant="ghost"
            >
              {t("clearAll")}
            </Button>
            <Button onClick={apply} type="button">
              {t("applyFilters")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
    <div className="flex h-8 max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed px-2.5 text-sm">
      {icon}
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="max-w-40 truncate">{value}</span>
      <Button
        aria-label={`${label}: ${value}`}
        className="-mr-1 size-6 rounded-full"
        onClick={onClear}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <HugeIcons className="size-3.5" icon={Cancel01Icon} />
      </Button>
    </div>
  );
}
