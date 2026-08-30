"use client";

import { Loading03Icon, Search02Icon } from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { Button } from "@repo/design-system/components/ui/button";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Input } from "@repo/design-system/components/ui/input";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { OpportunityPathway, WorkMode } from "@repo/domain/opportunity";
import { useAction, useQuery } from "convex/react";
import { Option, Schema } from "effect";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { resultColumnClass } from "@/components/columns";
import { Filters } from "@/components/filters";
import { Results } from "@/components/results";

const skeletonColumns = [
  "select",
  "recommendation",
  "role",
  "company",
  "location",
  "pathway",
  "mode",
  "salary",
  "source",
  "actions",
];
const skeletonRows = ["first", "second", "third", "fourth", "fifth"];
const tableRows = [
  ...skeletonRows,
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
] as const;

/** Returns a selected form value or removes the neutral any option. */
function selected(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "");
  return value === "any" || value === "" ? undefined : value;
}

/** Runs filtered discovery and renders one durable realtime search session. */
export function Search() {
  const t = useTranslations("search");
  const common = useTranslations("common");
  const locale = useLocale() === "id" ? "id" : "en";
  const startSearch = useAction(api.opportunities.start);
  const profile = useQuery(api.profiles.get);
  const latest = useQuery(api.searches.latest);
  const [activeSearchId, setActiveSearchId] = useState<Id<"searches"> | null>(
    null
  );
  const searchId = activeSearchId ?? latest?._id;
  const session = useQuery(api.searches.get, searchId ? { searchId } : "skip");
  const opportunities = useQuery(
    api.opportunities.list,
    session?.status === "complete" ? { searchId: session._id } : "skip"
  );
  const [submitting, setSubmitting] = useState(false);
  const running = submitting || session?.status === "running";
  const hydrating =
    latest === undefined ||
    profile === undefined ||
    (Boolean(searchId) && session === undefined);
  const disabled = running || hydrating;

  /** Starts one validated search while Convex owns all background progress. */
  async function submit(formData: FormData) {
    const query = String(formData.get("query") ?? "").trim();
    const country = selected(formData, "country");
    const pathway = Option.getOrUndefined(
      Schema.decodeUnknownOption(OpportunityPathway)(
        selected(formData, "pathway")
      )
    );
    const workMode = Option.getOrUndefined(
      Schema.decodeUnknownOption(WorkMode)(selected(formData, "workMode"))
    );

    if (!(query || country || pathway || workMode)) {
      toast.error(t("missing"));
      return;
    }

    setSubmitting(true);
    const started = await startSearch({
      ...(country ? { country } : {}),
      locale,
      ...(pathway ? { pathway } : {}),
      query,
      ...(workMode ? { workMode } : {}),
    }).then(
      (value) => value,
      () => null
    );
    setSubmitting(false);
    if (!started) {
      toast.error(common("error"));
      return;
    }
    setActiveSearchId(started.searchId);
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="sticky top-16 z-10 shrink-0 border-b bg-background lg:top-0">
        <div className="mx-auto w-full max-w-[90rem] px-4 py-3 sm:px-6">
          <h1 className="sr-only">{t("title")}</h1>
          <form
            action={submit}
            className="space-y-3"
            key={profile?.updatedAt ?? "search"}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                className="flex-1"
                defaultValue={profile?.desiredRoles[0] ?? ""}
                disabled={disabled}
                maxLength={400}
                name="query"
                placeholder={t("placeholder")}
              />
              <Button className="shrink-0" disabled={disabled} type="submit">
                <HugeIcons
                  className={running ? "size-4 animate-spin" : "size-4"}
                  icon={running ? Loading03Icon : Search02Icon}
                />
                {running ? t("working") : t("button")}
              </Button>
            </div>
            <Filters
              defaults={{
                country: profile?.desiredLocations[0],
                pathway: profile?.pathways[0],
                workMode: profile?.workModes[0],
              }}
              disabled={disabled}
            />
          </form>
        </div>
      </header>

      <div
        aria-live="polite"
        className="mx-auto min-h-56 w-full min-w-0 max-w-[90rem] flex-1 px-4 py-4 sm:px-6"
      >
        {hydrating ||
        running ||
        (session?.status === "complete" && !opportunities) ? (
          <SearchSkeleton />
        ) : null}
        {!(hydrating || running) && session?.status === "failed" ? (
          <p className="rounded-md border p-4 text-muted-foreground text-sm">
            {t("failed")}
          </p>
        ) : null}
        {!(hydrating || running) &&
        session?.status === "complete" &&
        opportunities ? (
          <Results records={opportunities} />
        ) : null}
      </div>
    </section>
  );
}

/** Mirrors final table geometry while a background search is running. */
function SearchSkeleton() {
  return (
    <div aria-hidden className="space-y-3">
      <div className="min-h-[37.75rem] overflow-hidden rounded-md border">
        <Table className="table-fixed" containerClassName="overflow-hidden">
          <TableHeader>
            <TableRow>
              {skeletonColumns.map((column) => (
                <TableHead className={resultColumnClass(column)} key={column}>
                  <Skeleton className="h-4 max-w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row) => (
              <TableRow className="h-14" key={row}>
                {skeletonColumns.map((column) => (
                  <TableCell
                    className={resultColumnClass(column)}
                    key={`${row}-${column}`}
                  >
                    <Skeleton className="h-5 max-w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
        </div>
      </div>
    </div>
  );
}
