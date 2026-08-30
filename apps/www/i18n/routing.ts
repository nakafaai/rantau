export const locales = ["en", "id"] as const;

export type Locale = (typeof locales)[number];

/** Returns whether an unknown route segment is a supported locale. */
export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}
