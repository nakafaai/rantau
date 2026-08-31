"use client";

import { ComboBox, EmptyState, Input, ListBox } from "@heroui/react";
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
    <ComboBox
      fullWidth
      isDisabled={disabled}
      onSelectionChange={(key) => {
        const country = countries.find((option) => option.code === key);
        onChange(country ?? null);
      }}
      selectedKey={selected?.code ?? null}
      variant="secondary"
    >
      <ComboBox.InputGroup>
        <Input
          id={id}
          placeholder={failed ? t("places-unavailable") : t("choose-country")}
        />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox
          renderEmptyState={() => (
            <EmptyState className="p-4 text-muted text-sm">
              {t("no-places")}
            </EmptyState>
          )}
        >
          {countries.map((country) => (
            <ListBox.Item
              id={country.code}
              key={country.code}
              textValue={country.label}
            >
              <CountryFlag countryCode={country.code} />
              <span className="min-w-0 flex-1 truncate">{country.label}</span>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}
