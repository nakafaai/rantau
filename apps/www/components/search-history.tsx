"use client";

import {
  Clock01Icon,
  Loading03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import type { Doc, Id } from "@repo/backend/convex/_generated/dataModel";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/design-system/components/ui/sheet";
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
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger
        render={<Button className="rounded-full" size="sm" variant="outline" />}
      >
        <HugeIcons className="size-4" icon={Clock01Icon} />
        {t("history")}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="shrink-0 border-b pr-12">
          <SheetTitle>{t("historyTitle")}</SheetTitle>
          <SheetDescription>{t("historyHelp")}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {status === "LoadingFirstPage" ? (
            <div className="flex h-32 items-center justify-center">
              <HugeIcons
                aria-label={t("historyLoading")}
                className="size-5 animate-spin text-muted-foreground"
                icon={Loading03Icon}
              />
            </div>
          ) : null}
          {status !== "LoadingFirstPage" && results.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground text-sm">
              {t("historyEmpty")}
            </p>
          ) : null}
          <ul className="divide-y">
            {results.map((search) => {
              const active = search._id === activeSearchId;
              const place = searchPlace(search);
              return (
                <li key={search._id}>
                  <button
                    aria-current={active ? "page" : undefined}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    onClick={() => select(search._id)}
                    type="button"
                  >
                    {search.countryCode ? (
                      <CountryFlag
                        className="mt-1"
                        countryCode={search.countryCode}
                      />
                    ) : (
                      <HugeIcons
                        className="mt-0.5 size-4 text-muted-foreground"
                        icon={Clock01Icon}
                      />
                    )}
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {search.query}
                        </span>
                        {search.status === "running" ? (
                          <Badge className="shrink-0" variant="secondary">
                            <HugeIcons
                              className="size-3 animate-spin"
                              icon={Loading03Icon}
                            />
                            {t("working")}
                          </Badge>
                        ) : null}
                      </span>
                      {place ? (
                        <span className="block truncate text-muted-foreground text-sm">
                          {place}
                        </span>
                      ) : null}
                      <span className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                        <span>{searchTimestamp(search.createdAt, locale)}</span>
                        <Badge variant="secondary">
                          {t("historyResults", {
                            count: search.resultCount ?? 0,
                          })}
                        </Badge>
                      </span>
                    </span>
                    {active ? (
                      <HugeIcons className="mt-1 size-4" icon={Tick02Icon} />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        {status === "CanLoadMore" || status === "LoadingMore" ? (
          <SheetFooter className="shrink-0 border-t">
            <Button
              disabled={status === "LoadingMore"}
              onClick={() => loadMore(20)}
              type="button"
              variant="outline"
            >
              {status === "LoadingMore" ? (
                <HugeIcons
                  className="size-4 animate-spin"
                  icon={Loading03Icon}
                />
              ) : null}
              {t("historyMore")}
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
