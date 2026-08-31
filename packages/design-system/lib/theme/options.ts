import { LaptopIcon, MoonIcon, Sun01Icon } from "@hugeicons/core-free-icons";
import { themes } from "@repo/design-system/lib/theme/registry";

type ThemeIconRegistry = {
  readonly [Value in (typeof themes)[number]["value"]]: typeof Sun01Icon;
};

const themeIcons = {
  light: Sun01Icon,
  dark: MoonIcon,
  system: LaptopIcon,
} satisfies ThemeIconRegistry;

/** Theme picker options backed by HeroUI's light and dark appearances. */
export const themeOptions = Object.freeze(
  themes.map((theme) => ({
    ...theme,
    icon: themeIcons[theme.value],
  }))
);
