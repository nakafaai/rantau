type ThemeShaderColor = `rgb(${number}, ${number}, ${number})`;

interface ThemeDefinition {
  readonly shaderColor: ThemeShaderColor;
  readonly value: string;
}

const SKY_SHADER_COLOR = "rgb(125, 211, 252)";

/** Selectable HeroUI appearances and the shader color owned by each theme. */
export const themes = [
  {
    value: "light",
    shaderColor: SKY_SHADER_COLOR,
  },
  {
    value: "dark",
    shaderColor: SKY_SHADER_COLOR,
  },
  {
    value: "system",
    shaderColor: SKY_SHADER_COLOR,
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

  return definition?.shaderColor ?? SKY_SHADER_COLOR;
}
