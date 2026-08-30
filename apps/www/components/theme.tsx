"use client";

import { PaintBoardIcon } from "@hugeicons/core-free-icons";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { themeOptions } from "@repo/design-system/lib/theme/options";
import { cn } from "@repo/design-system/lib/utils";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

const BASE_THEMES_COUNT = 3;

/** Renders Nakafa's complete theme selector on the Rantau auth screen. */
export function Theme() {
  const t = useTranslations("common");
  const { theme: currentTheme, setTheme } = useTheme();

  /** Reports whether one theme option is selected. */
  function isActive(value: string) {
    return currentTheme === value;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost">
            <HugeIcons icon={PaintBoardIcon} />
            <span className="truncate">{t("theme")}</span>
          </Button>
        }
      />

      <DropdownMenuContent
        align="end"
        className="max-h-[min(var(--available-height),24rem)] w-max max-w-[calc(100vw-2rem)]"
      >
        <DropdownMenuGroup>
          {themeOptions.slice(0, BASE_THEMES_COUNT).map((theme) => (
            <ThemeOption
              active={isActive(theme.value)}
              icon={theme.icon}
              key={theme.value}
              onSelect={() => setTheme(theme.value)}
              value={theme.value}
            />
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {themeOptions.slice(BASE_THEMES_COUNT).map((theme) => (
            <ThemeOption
              active={isActive(theme.value)}
              icon={theme.icon}
              key={theme.value}
              onSelect={() => setTheme(theme.value)}
              value={theme.value}
            />
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type ThemeOptionProps = Readonly<{
  active: boolean;
  icon: (typeof themeOptions)[number]["icon"];
  onSelect: () => void;
  value: string;
}>;

/** Renders one selectable theme row with Nakafa's quiet active marker. */
function ThemeOption({ active, icon, onSelect, value }: ThemeOptionProps) {
  return (
    <DropdownMenuItem
      className="cursor-pointer"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <HugeIcons className="shrink-0" icon={icon} />
      <span className="truncate capitalize">{value}</span>
      <span
        className={cn(
          "ml-auto size-2 rounded-full bg-primary opacity-0 transition-opacity",
          active && "opacity-100"
        )}
      />
    </DropdownMenuItem>
  );
}
