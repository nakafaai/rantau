"use client";

import type { Key } from "@heroui/react";
import { Button, Dropdown, Label } from "@heroui/react";
import { PaintBoardIcon, TranslateIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { themeOptions } from "@repo/design-system/lib/theme/options";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { CountryFlag } from "@/components/country-flag";
import { localizedPath } from "@/lib/locale";

const languages = [
  { countryCode: "GB", label: "English", value: "en" },
  { countryCode: "ID", label: "Bahasa Indonesia", value: "id" },
] as const;

/** Renders locale choices and preserves the active workspace destination. */
function LanguageMenu({ onNavigate }: { onNavigate?: () => void }) {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  /** Switches locale through Next navigation without a document reload. */
  function selectLanguage(key: Key) {
    const language = languages.find((option) => option.value === key);
    if (!language) {
      return;
    }
    const basePath = localizedPath(language.value, pathname);
    const query = searchParams.toString();
    router.replace(query ? `${basePath}?${query}` : basePath, {
      scroll: false,
    });
    onNavigate?.();
  }

  return (
    <Dropdown.Menu
      onAction={selectLanguage}
      selectedKeys={new Set([currentLocale])}
      selectionMode="single"
    >
      {languages.map((language) => (
        <Dropdown.Item
          id={language.value}
          key={language.value}
          textValue={language.label}
        >
          <CountryFlag countryCode={language.countryCode} />
          <Label>{language.label}</Label>
          <Dropdown.ItemIndicator type="dot" />
        </Dropdown.Item>
      ))}
    </Dropdown.Menu>
  );
}

/** Renders HeroUI light, dark, and system appearance choices. */
function ThemeMenu() {
  const { theme: currentTheme, setTheme } = useTheme();

  /** Applies one known HeroUI appearance. */
  function selectTheme(key: Key) {
    const theme = themeOptions.find((option) => option.value === key);
    if (theme) {
      setTheme(theme.value);
    }
  }

  return (
    <Dropdown.Menu
      onAction={selectTheme}
      selectedKeys={currentTheme ? new Set([currentTheme]) : new Set()}
      selectionMode="single"
    >
      {themeOptions.map((theme) => (
        <Dropdown.Item
          id={theme.value}
          key={theme.value}
          textValue={theme.value}
        >
          <HugeiconsIcon className="size-4" icon={theme.icon} strokeWidth={2} />
          <Label className="capitalize">{theme.value}</Label>
          <Dropdown.ItemIndicator type="dot" />
        </Dropdown.Item>
      ))}
    </Dropdown.Menu>
  );
}

/** Renders HeroUI preference submenus inside the account dropdown. */
export function PreferenceSubmenus({
  onNavigate,
  side,
}: {
  onNavigate?: () => void;
  side: "right" | "top";
}) {
  const t = useTranslations("common");

  return (
    <>
      <Dropdown.SubmenuTrigger>
        <Dropdown.Item id="language-menu" textValue={t("language")}>
          <HugeiconsIcon
            className="size-4"
            icon={TranslateIcon}
            strokeWidth={2}
          />
          <Label>{t("language")}</Label>
          <Dropdown.SubmenuIndicator />
        </Dropdown.Item>
        <Dropdown.Popover placement={side}>
          <LanguageMenu onNavigate={onNavigate} />
        </Dropdown.Popover>
      </Dropdown.SubmenuTrigger>
      <Dropdown.SubmenuTrigger>
        <Dropdown.Item id="theme-menu" textValue={t("theme")}>
          <HugeiconsIcon
            className="size-4"
            icon={PaintBoardIcon}
            strokeWidth={2}
          />
          <Label>{t("theme")}</Label>
          <Dropdown.SubmenuIndicator />
        </Dropdown.Item>
        <Dropdown.Popover placement={side}>
          <ThemeMenu />
        </Dropdown.Popover>
      </Dropdown.SubmenuTrigger>
    </>
  );
}

/** Renders compact auth-page language and theme controls. */
export function AuthPreferences() {
  const t = useTranslations("common");

  return (
    <div className="flex items-center gap-1">
      <Dropdown>
        <Button variant="ghost">
          <HugeiconsIcon
            className="size-4"
            icon={TranslateIcon}
            strokeWidth={2}
          />
          <span className="truncate">{t("language")}</span>
        </Button>
        <Dropdown.Popover placement="bottom end">
          <LanguageMenu />
        </Dropdown.Popover>
      </Dropdown>
      <Dropdown>
        <Button aria-label={t("theme")} isIconOnly variant="ghost">
          <HugeiconsIcon
            className="size-4"
            icon={PaintBoardIcon}
            strokeWidth={2}
          />
        </Button>
        <Dropdown.Popover placement="bottom end">
          <ThemeMenu />
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
