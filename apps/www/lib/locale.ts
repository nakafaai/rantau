const paths = {
  en: "/en/index.html",
  id: "/id/index.html",
} as const;

/** Returns the exact locale asset published by Convex Static Hosting. */
export function localePath(locale: "en" | "id") {
  return paths[locale];
}

/** Returns the other locale's exact static asset. */
export function alternatePath(locale: string) {
  return localePath(locale === "id" ? "en" : "id");
}
