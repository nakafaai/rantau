type ThemeShaderColor = `rgb(${number}, ${number}, ${number})`;

interface ThemeDefinition {
  readonly shaderColor: ThemeShaderColor;
  readonly value: string;
}

const LIGHT_SHADER_COLOR = "rgb(222, 54, 67)";

/** Selectable HeroUI appearances and the shader color owned by each theme. */
export const themes = [
  {
    value: "light",
    shaderColor: LIGHT_SHADER_COLOR,
  },
  {
    value: "dark",
    shaderColor: "rgb(246, 116, 126)",
  },
  {
    value: "system",
    shaderColor: LIGHT_SHADER_COLOR,
  },
] as const satisfies readonly ThemeDefinition[];

/** Theme identifier accepted by the shared runtime and document bootstrap. */
export type ThemeValue = (typeof themes)[number]["value"];

/** Local-storage key owned by the next-themes runtime. */
export const THEME_STORAGE_KEY = "theme";

/** First-visit theme resolved by next-themes before first paint. */
export const DEFAULT_THEME = "system" satisfies ThemeValue;

/** Concrete class names managed on the document root. */
export const concreteThemeValues = ["light", "dark"];

/** Returns the deterministic sRGB projection used by shader-only renderers. */
export function getThemeShaderColor(resolvedTheme: string | undefined) {
  const definition = themes.find((theme) => theme.value === resolvedTheme);

  return definition?.shaderColor ?? LIGHT_SHADER_COLOR;
}
