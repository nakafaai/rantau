"use client";

import {
  ComboBox,
  Description,
  EmptyState,
  Input,
  Label,
  ListBox,
} from "@heroui/react";
import { Effect } from "effect";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
  onChange: (value: PlaceDraft) => void;
  value: PlaceDraft;
}>;

type RegionState = Readonly<{
  key: string;
  options: readonly RegionOption[];
}>;

type CityState = Readonly<{
  key: string;
  options: readonly CityOption[];
}>;

/** Renders dependent country, region, and city comboboxes. */
export function LocationFields({ onChange, value }: LocationFieldsProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  const [regionState, setRegionState] = useState<RegionState>({
    key: "",
    options: [],
  });
  const [cityState, setCityState] = useState<CityState>({
    key: "",
    options: [],
  });
  const regionKey = `${locale}:${value.countryCode}`;
  const cityKey = `${regionKey}:${value.regionCode}`;
  const regions =
    value.countryCode && regionState.key === regionKey
      ? regionState.options
      : [];
  const cities =
    value.countryCode && value.regionCode && cityState.key === cityKey
      ? cityState.options
      : [];
  const regionsLoading =
    Boolean(value.countryCode) &&
    !regions.length &&
    regionState.key !== regionKey;
  const citiesLoading =
    Boolean(value.countryCode && value.regionCode) &&
    !cities.length &&
    cityState.key !== cityKey;

  useEffect(() => {
    if (!value.countryCode) {
      return;
    }
    let active = true;
    Effect.runPromise(loadRegions(value.countryCode, locale)).then(
      (options) => {
        if (active) {
          setRegionState({ key: regionKey, options });
        }
      },
      () => {
        if (active) {
          setRegionState({ key: regionKey, options: [] });
        }
      }
    );
    return () => {
      active = false;
    };
  }, [locale, regionKey, value.countryCode]);

  useEffect(() => {
    if (!(value.countryCode && value.regionCode)) {
      return;
    }
    let active = true;
    Effect.runPromise(
      loadCities(value.countryCode, value.regionCode, locale)
    ).then(
      (options) => {
        if (active) {
          setCityState({ key: cityKey, options });
        }
      },
      () => {
        if (active) {
          setCityState({ key: cityKey, options: [] });
        }
      }
    );
    return () => {
      active = false;
    };
  }, [cityKey, locale, value.countryCode, value.regionCode]);

  const selectedRegion = regions.find(
    (region) => region.code === value.regionCode
  );
  const selectedCity = cities.find((city) => city.name === value.city);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="search-country">{t("country")}</Label>
        <CountryPicker
          code={value.countryCode}
          disabled={false}
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
        <Description>{t("countryHelp")}</Description>
      </div>

      <ComboBox
        fullWidth
        isDisabled={!value.countryCode || regionsLoading}
        onSelectionChange={(key) => {
          const region = regions.find((option) => option.code === key);
          onChange({
            ...value,
            city: "",
            region: region?.name ?? "",
            regionCode: region?.code ?? "",
          });
        }}
        selectedKey={selectedRegion?.code ?? null}
      >
        <Label>{t("region")}</Label>
        <ComboBox.InputGroup>
          <Input
            id="search-region"
            placeholder={
              regionsLoading ? t("loadingPlaces") : t("chooseRegion")
            }
            variant="secondary"
          />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox
            renderEmptyState={() => (
              <EmptyState className="p-4 text-muted text-sm">
                {t("noPlaces")}
              </EmptyState>
            )}
          >
            {regions.map((region) => (
              <ListBox.Item
                id={region.code}
                key={region.code}
                textValue={region.label}
              >
                {region.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>

      <ComboBox
        fullWidth
        isDisabled={!value.regionCode || citiesLoading}
        onSelectionChange={(key) => {
          const city = cities.find((option) => option.id === key);
          onChange({ ...value, city: city?.name ?? "" });
        }}
        selectedKey={selectedCity?.id ?? null}
      >
        <Label>{t("city")}</Label>
        <ComboBox.InputGroup>
          <Input
            id="search-city"
            placeholder={citiesLoading ? t("loadingPlaces") : t("chooseCity")}
            variant="secondary"
          />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox
            renderEmptyState={() => (
              <EmptyState className="p-4 text-muted text-sm">
                {t("noPlaces")}
              </EmptyState>
            )}
          >
            {cities.map((city) => (
              <ListBox.Item id={city.id} key={city.id} textValue={city.label}>
                {city.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </div>
  );
}
