"use client";

import { Cancel01Icon, FilterAddIcon } from "@hugeicons/core-free-icons";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Input } from "@repo/design-system/components/ui/input";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { CountryFlag } from "@/components/country-flag";
import { countries, pathways, workModes } from "@/lib/options";

type FiltersProps = Readonly<{
  defaults: {
    country?: string;
    pathway?: Pathway;
    workMode?: WorkMode;
  };
  disabled: boolean;
}>;

type ChipProps = Readonly<{
  children: ReactNode;
  icon?: ReactNode;
  label: string;
  onClear: () => void;
  value: string;
}>;

type Pathway = (typeof pathways)[number];
type WorkMode = (typeof workModes)[number];

/** Renders Vercel-style search filters while preserving profile defaults. */
export function Filters({ defaults, disabled }: FiltersProps) {
  const t = useTranslations("search");
  const common = useTranslations("common");
  const [country, setCountry] = useState(defaults.country ?? "");
  const [pathway, setPathway] = useState(defaults.pathway ?? "");
  const [workMode, setWorkMode] = useState(defaults.workMode ?? "");
  const selectedCountry = countries.find((item) => item.value === country);
  const countryName = selectedCountry
    ? common(`countries.${selectedCountry.code}`)
    : country;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Input name="country" type="hidden" value={country} />
      <Input name="pathway" type="hidden" value={pathway} />
      <Input name="workMode" type="hidden" value={workMode} />

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          render={
            <Button className="rounded-full" size="sm" variant="outline" />
          }
        >
          <HugeIcons className="size-4" icon={FilterAddIcon} />
          {t("addFilter")}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuLabel>{t("filterBy")}</DropdownMenuLabel>
          <DropdownMenuGroup>
            <CountrySub onSelect={setCountry} />
            <PathwaySub onSelect={setPathway} />
            <WorkModeSub onSelect={setWorkMode} />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {country ? (
        <FilterChip
          icon={
            selectedCountry ? (
              <CountryFlag countryCode={selectedCountry.code} />
            ) : null
          }
          label={t("country")}
          onClear={() => setCountry("")}
          value={countryName}
        >
          {countries.map((item) => (
            <DropdownMenuItem
              key={item.code}
              onClick={() => setCountry(item.value)}
            >
              <CountryFlag countryCode={item.code} />
              {common(`countries.${item.code}`)}
            </DropdownMenuItem>
          ))}
        </FilterChip>
      ) : null}

      {pathway ? (
        <FilterChip
          label={t("pathway")}
          onClear={() => setPathway("")}
          value={t(pathway)}
        >
          {pathways.map((item) => (
            <DropdownMenuItem key={item} onClick={() => setPathway(item)}>
              {t(item)}
            </DropdownMenuItem>
          ))}
        </FilterChip>
      ) : null}

      {workMode ? (
        <FilterChip
          label={t("workMode")}
          onClear={() => setWorkMode("")}
          value={t(workMode)}
        >
          {workModes.map((item) => (
            <DropdownMenuItem key={item} onClick={() => setWorkMode(item)}>
              {t(item)}
            </DropdownMenuItem>
          ))}
        </FilterChip>
      ) : null}
    </div>
  );
}

/** Renders the country branch inside the add-filter menu. */
function CountrySub({ onSelect }: { onSelect: (value: string) => void }) {
  const t = useTranslations("search");
  const common = useTranslations("common");

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{t("country")}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="max-h-72 min-w-52">
        {countries.map((country) => (
          <DropdownMenuItem
            key={country.code}
            onClick={() => onSelect(country.value)}
          >
            <CountryFlag countryCode={country.code} />
            {common(`countries.${country.code}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/** Renders the opportunity-pathway branch inside the add-filter menu. */
function PathwaySub({ onSelect }: { onSelect: (value: Pathway) => void }) {
  const t = useTranslations("search");

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{t("pathway")}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-48">
        {pathways.map((pathway) => (
          <DropdownMenuItem key={pathway} onClick={() => onSelect(pathway)}>
            {t(pathway)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/** Renders the work-mode branch inside the add-filter menu. */
function WorkModeSub({ onSelect }: { onSelect: (value: WorkMode) => void }) {
  const t = useTranslations("search");

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{t("workMode")}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-48">
        {workModes.map((workMode) => (
          <DropdownMenuItem key={workMode} onClick={() => onSelect(workMode)}>
            {t(workMode)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/** Renders one applied filter as an editable compact chip. */
function FilterChip({ children, icon, label, onClear, value }: ChipProps) {
  const t = useTranslations("search");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            className="max-w-full gap-1.5 rounded-full border-dashed"
            size="sm"
            variant="outline"
          />
        }
      >
        {icon}
        <span className="text-muted-foreground">{label}</span>
        <span className="max-w-40 truncate">{value}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72 min-w-52">
        <DropdownMenuGroup>{children}</DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onClear}>
          <HugeIcons className="size-4" icon={Cancel01Icon} />
          {t("clearFilter")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
