import { isLocale, type Locale } from "@/i18n/routing";

export type WorkspaceRoute = "applications" | "profile" | "search";

const segments = {
  applications: "applications",
  profile: "profile",
  search: "",
} as const satisfies Record<WorkspaceRoute, string>;

/** Returns a clean localized path for one route-owned workspace page. */
export function workspacePath(locale: Locale, route: WorkspaceRoute) {
  const segment = segments[route];
  return segment ? `/${locale}/${segment}/` : `/${locale}/`;
}

/** Reads the workspace route represented by a clean public pathname. */
export function workspaceRoute(pathname: string): WorkspaceRoute {
  const segmentsInPath = pathname.split("/").filter(Boolean);
  const candidate = isLocale(segmentsInPath[0] ?? "")
    ? segmentsInPath[1]
    : segmentsInPath[0];

  if (candidate === "profile" || candidate === "applications") {
    return candidate;
  }
  return "search";
}

/** Projects the current workspace destination into a selected locale. */
export function localizedPath(locale: Locale, pathname: string) {
  return workspacePath(locale, workspaceRoute(pathname));
}

/** Changes locale while preserving the current workspace destination. */
export function alternatePath(locale: string, pathname: string) {
  const nextLocale: Locale = locale === "id" ? "en" : "id";
  return localizedPath(nextLocale, pathname);
}
