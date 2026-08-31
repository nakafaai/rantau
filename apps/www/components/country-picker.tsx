"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@repo/design-system/components/ui/combobox";
import { Effect } from "effect";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { CountryFlag } from "@/components/country-flag";
import {
  type CountryOption,
  countryCodeFromName,
  loadCountries,
} from "@/lib/geography";

type CountryPickerProps = Readonly<{
  code?: string;
  disabled: boolean;
  id: string;
  onChange: (country: CountryOption | null) => void;
  value: string;
}>;

/** Renders a searchable global country picker with ASEAN countries first. */
export function CountryPicker({
  code,
  disabled,
  id,
  onChange,
  value,
}: CountryPickerProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  const [countries, setCountries] = useState<readonly CountryOption[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    Effect.runPromise(loadCountries(locale)).then(
      (options) => {
        if (active) {
          setCountries(options);
          setFailed(false);
        }
      },
      () => {
        if (active) {
          setFailed(true);
        }
      }
    );
    return () => {
      active = false;
    };
  }, [locale]);

  const normalized = value.toLowerCase();
  const resolvedCode = code ?? countryCodeFromName(value, locale);
  const selected = countries.find(
    (country) =>
      country.code === resolvedCode ||
      country.name.toLowerCase() === normalized ||
      country.label.toLowerCase() === normalized
  );

  return (
    <Combobox
      autoHighlight
      disabled={disabled}
      items={countries}
      itemToStringValue={(country: CountryOption) => country.label}
      onValueChange={onChange}
      value={selected ?? null}
    >
      <ComboboxInput
        id={id}
        placeholder={failed ? t("placesUnavailable") : t("chooseCountry")}
        showClear
      />
      <ComboboxContent>
        <ComboboxEmpty>{t("noPlaces")}</ComboboxEmpty>
        <ComboboxList>
          {(country) => (
            <ComboboxItem key={country.code} value={country}>
              <CountryFlag countryCode={country.code} />
              <span className="min-w-0 flex-1 truncate">{country.label}</span>
              {country.group === "asean" ? (
                <span className="text-muted-foreground text-xs">ASEAN</span>
              ) : null}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
