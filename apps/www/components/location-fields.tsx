"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@repo/design-system/components/ui/combobox";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@repo/design-system/components/ui/field";
import { Effect } from "effect";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { CountryPicker } from "@/components/country-picker";
import {
  type CityOption,
  loadCities,
  loadRegions,
  type RegionOption,
} from "@/lib/geography";

export type PlaceDraft = Readonly<{
  city: string;
  country: string;
  countryCode: string;
  region: string;
  regionCode: string;
}>;

type LocationFieldsProps = Readonly<{
  disabled: boolean;
  onChange: (value: PlaceDraft) => void;
  value: PlaceDraft;
}>;

/** Renders dependent country, region, and city comboboxes. */
export function LocationFields({
  disabled,
  onChange,
  value,
}: LocationFieldsProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  const [regions, setRegions] = useState<readonly RegionOption[]>([]);
  const [cities, setCities] = useState<readonly CityOption[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  useEffect(() => {
    if (!value.countryCode) {
      setRegions([]);
      return;
    }
    let active = true;
    setRegionsLoading(true);
    Effect.runPromise(loadRegions(value.countryCode, locale)).then(
      (options) => {
        if (active) {
          setRegions(options);
          setRegionsLoading(false);
        }
      },
      () => {
        if (active) {
          setRegions([]);
          setRegionsLoading(false);
        }
      }
    );
    return () => {
      active = false;
    };
  }, [locale, value.countryCode]);

  useEffect(() => {
    if (!(value.countryCode && value.regionCode)) {
      setCities([]);
      return;
    }
    let active = true;
    setCitiesLoading(true);
    Effect.runPromise(
      loadCities(value.countryCode, value.regionCode, locale)
    ).then(
      (options) => {
        if (active) {
          setCities(options);
          setCitiesLoading(false);
        }
      },
      () => {
        if (active) {
          setCities([]);
          setCitiesLoading(false);
        }
      }
    );
    return () => {
      active = false;
    };
  }, [locale, value.countryCode, value.regionCode]);

  const selectedRegion = useMemo(
    () => regions.find((region) => region.code === value.regionCode),
    [regions, value.regionCode]
  );
  const selectedCity = useMemo(
    () => cities.find((city) => city.name === value.city),
    [cities, value.city]
  );

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel htmlFor="search-country">{t("country")}</FieldLabel>
        <CountryPicker
          code={value.countryCode}
          disabled={disabled}
          id="search-country"
          onChange={(country) =>
            onChange({
              city: "",
              country: country?.name ?? "",
              countryCode: country?.code ?? "",
              region: "",
              regionCode: "",
            })
          }
          value={value.country}
        />
        <FieldDescription>{t("countryHelp")}</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="search-region">{t("region")}</FieldLabel>
        <Combobox
          autoHighlight
          disabled={disabled || !value.countryCode || regionsLoading}
          items={regions}
          itemToStringValue={(region: RegionOption) => region.label}
          onValueChange={(region) =>
            onChange({
              ...value,
              city: "",
              region: region?.name ?? "",
              regionCode: region?.code ?? "",
            })
          }
          value={selectedRegion ?? null}
        >
          <ComboboxInput
            id="search-region"
            placeholder={
              regionsLoading ? t("loadingPlaces") : t("chooseRegion")
            }
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>{t("noPlaces")}</ComboboxEmpty>
            <ComboboxList>
              {(region) => (
                <ComboboxItem key={region.code} value={region}>
                  {region.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>

      <Field>
        <FieldLabel htmlFor="search-city">{t("city")}</FieldLabel>
        <Combobox
          autoHighlight
          disabled={disabled || !value.regionCode || citiesLoading}
          items={cities}
          itemToStringValue={(city: CityOption) => city.label}
          onValueChange={(city) =>
            onChange({ ...value, city: city?.name ?? "" })
          }
          value={selectedCity ?? null}
        >
          <ComboboxInput
            id="search-city"
            placeholder={citiesLoading ? t("loadingPlaces") : t("chooseCity")}
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>{t("noPlaces")}</ComboboxEmpty>
            <ComboboxList>
              {(city) => (
                <ComboboxItem key={city.id} value={city}>
                  {city.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
    </div>
  );
}
