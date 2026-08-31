"use client";

import { Button, Chip, Drawer, ScrollShadow, Spinner } from "@heroui/react";
import { Clock01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { api } from "@repo/backend/convex/_generated/api";
import type { Doc, Id } from "@repo/backend/convex/_generated/dataModel";
import { usePaginatedQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { CountryFlag } from "@/components/country-flag";

type SearchHistoryProps = Readonly<{
  activeSearchId?: Id<"searches">;
}>;

const historyMonths = {
  en: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  id: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ],
} as const;

/** Formats the narrowest durable place stored on a search session. */
function searchPlace(search: Doc<"searches">) {
  return [search.city, search.region, search.country]
    .filter(Boolean)
    .join(", ");
}

/** Formats one stored timestamp deterministically in UTC for hydration safety. */
function searchTimestamp(timestamp: number, locale: string) {
  const date = new Date(timestamp);
  const language = locale === "id" ? "id" : "en";
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = historyMonths[language][date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hour}:${minute} UTC`;
}

/** Renders realtime, paginated search history without leaving the workspace. */
export function SearchHistory({ activeSearchId }: SearchHistoryProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const { loadMore, results, status } = usePaginatedQuery(
    api.searchhistory.history,
    {},
    { initialNumItems: 20 }
  );

  /** Selects one durable session through client routing, preserving app state. */
  function select(searchId: Id<"searches">) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", searchId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setOpen(false);
  }

  return (
    <>
      <Button onPress={() => setOpen(true)} size="sm" variant="tertiary">
        <HugeiconsIcon className="size-4" icon={Clock01Icon} strokeWidth={2} />
        {t("history")}
      </Button>
      <Drawer.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="w-full sm:max-w-md">
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>{t("history-title")}</Drawer.Heading>
              <p className="text-muted text-sm">{t("history-help")}</p>
            </Drawer.Header>
            <Drawer.Body>
              <ScrollShadow className="h-full">
                {status === "LoadingFirstPage" ? (
                  <div className="flex h-32 items-center justify-center">
                    <Spinner aria-label={t("history-loading")} size="md" />
                  </div>
                ) : null}
                {status !== "LoadingFirstPage" && results.length === 0 ? (
                  <p className="p-6 text-center text-muted text-sm">
                    {t("history-empty")}
                  </p>
                ) : null}
                <ul className="divide-y divide-separator">
                  {results.map((search) => {
                    const active = search._id === activeSearchId;
                    const place = searchPlace(search);
                    return (
                      <li key={search._id}>
                        <Button
                          aria-current={active ? "page" : undefined}
                          className="h-auto w-full justify-start rounded-none px-4 py-3 text-left"
                          fullWidth
                          onPress={() => select(search._id)}
                          variant={active ? "secondary" : "ghost"}
                        >
                          {search.countryCode ? (
                            <CountryFlag
                              className="mt-1"
                              countryCode={search.countryCode}
                            />
                          ) : (
                            <HugeiconsIcon
                              className="mt-0.5 size-4 text-muted"
                              icon={Clock01Icon}
                              strokeWidth={2}
                            />
                          )}
                          <span className="min-w-0 flex-1 space-y-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-medium">
                                {search.query}
                              </span>
                              {search.status === "running" ? (
                                <Chip
                                  className="shrink-0"
                                  size="sm"
                                  variant="soft"
                                >
                                  <Spinner size="sm" />
                                  {t("working")}
                                </Chip>
                              ) : null}
                            </span>
                            {place ? (
                              <span className="block truncate text-muted text-sm">
                                {place}
                              </span>
                            ) : null}
                            <span className="flex flex-wrap items-center gap-2 text-muted text-xs">
                              <span>
                                {searchTimestamp(search.createdAt, locale)}
                              </span>
                              <Chip size="sm" variant="tertiary">
                                {t("history-results", {
                                  count: search.resultCount ?? 0,
                                })}
                              </Chip>
                            </span>
                          </span>
                          {active ? (
                            <HugeiconsIcon
                              className="mt-1 size-4"
                              icon={Tick02Icon}
                              strokeWidth={2}
                            />
                          ) : null}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollShadow>
            </Drawer.Body>
            {status === "CanLoadMore" || status === "LoadingMore" ? (
              <Drawer.Footer>
                <Button
                  fullWidth
                  isDisabled={status === "LoadingMore"}
                  isPending={status === "LoadingMore"}
                  onPress={() => loadMore(20)}
                  type="button"
                  variant="secondary"
                >
                  {t("history-more")}
                </Button>
              </Drawer.Footer>
            ) : null}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}
