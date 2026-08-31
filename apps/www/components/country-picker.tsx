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
import { useEffect, useMemo, useRef, useState } from "react";
import { CountryFlag } from "@/components/country-flag";
import { type CountryOption, loadCountries } from "@/lib/geography";

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
  const resolvedDefault = useRef("");

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

  const selected = useMemo(() => {
    const normalized = value.toLocaleLowerCase();
    return countries.find(
      (country) =>
        country.code === code ||
        country.name.toLocaleLowerCase() === normalized ||
        country.label.toLocaleLowerCase() === normalized
    );
  }, [code, countries, value]);

  useEffect(() => {
    if (
      code ||
      !selected ||
      !value ||
      resolvedDefault.current === selected.code
    ) {
      return;
    }
    resolvedDefault.current = selected.code;
    onChange(selected);
  }, [code, onChange, selected, value]);

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
