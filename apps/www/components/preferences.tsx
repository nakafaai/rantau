"use client";

import { PaintBoardIcon, TranslateIcon } from "@hugeicons/core-free-icons";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { themeOptions } from "@repo/design-system/lib/theme/options";
import { cn } from "@repo/design-system/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";
import { CountryFlag } from "@/components/country-flag";
import { localizedPath } from "@/lib/locale";

const BASE_THEMES_COUNT = 3;
const languages = [
  { countryCode: "GB", label: "English", value: "en" },
  { countryCode: "ID", label: "Bahasa Indonesia", value: "id" },
] as const;

/** Shows one selected option without changing the menu label layout. */
function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "ml-auto size-2 rounded-full bg-primary opacity-0 transition-opacity",
        active && "opacity-100"
      )}
    />
  );
}

/** Renders locale choices and preserves the active workspace destination. */
function LanguageItems() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return languages.map((language) => (
    <DropdownMenuItem
      className="cursor-pointer"
      key={language.value}
      onClick={() => router.replace(localizedPath(language.value, pathname))}
    >
      <CountryFlag countryCode={language.countryCode} />
      <span className="truncate">{language.label}</span>
      <ActiveBadge active={currentLocale === language.value} />
    </DropdownMenuItem>
  ));
}

/** Renders theme choices directly from the copied Nakafa theme registry. */
function ThemeItems() {
  const { theme: currentTheme, setTheme } = useTheme();

  return (
    <>
      <DropdownMenuGroup>
        {themeOptions.slice(0, BASE_THEMES_COUNT).map((theme) => (
          <DropdownMenuItem
            className="cursor-pointer"
            key={theme.value}
            onClick={() => setTheme(theme.value)}
          >
            <HugeIcons className="size-4" icon={theme.icon} />
            <span className="truncate capitalize">{theme.value}</span>
            <ActiveBadge active={currentTheme === theme.value} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {themeOptions.slice(BASE_THEMES_COUNT).map((theme) => (
          <DropdownMenuItem
            className="cursor-pointer"
            key={theme.value}
            onClick={() => setTheme(theme.value)}
          >
            <HugeIcons className="size-4" icon={theme.icon} />
            <span className="truncate capitalize">{theme.value}</span>
            <ActiveBadge active={currentTheme === theme.value} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
    </>
  );
}

/** Renders Nakafa-style preference submenus inside the account dropdown. */
export function PreferenceSubmenus({
  side,
}: {
  side: ComponentProps<typeof DropdownMenuSubContent>["side"];
}) {
  const t = useTranslations("common");

  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="cursor-pointer">
          <HugeIcons className="size-4" icon={TranslateIcon} />
          <span className="truncate">{t("language")}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent side={side}>
          <DropdownMenuGroup>
            <LanguageItems />
          </DropdownMenuGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="cursor-pointer">
          <HugeIcons className="size-4" icon={PaintBoardIcon} />
          <span className="truncate">{t("theme")}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent
          className="max-h-[min(var(--available-height),24rem)]"
          side={side}
        >
          <ThemeItems />
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  );
}

/** Renders compact auth-page language and theme controls. */
export function AuthPreferences() {
  const t = useTranslations("common");

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost">
              <HugeIcons className="size-4" icon={TranslateIcon} />
              <span className="truncate">{t("language")}</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <LanguageItems />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button aria-label={t("theme")} size="icon" variant="ghost">
              <HugeIcons className="size-4" icon={PaintBoardIcon} />
            </Button>
          }
        />
        <DropdownMenuContent
          align="end"
          className="max-h-[min(var(--available-height),24rem)]"
        >
          <ThemeItems />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
