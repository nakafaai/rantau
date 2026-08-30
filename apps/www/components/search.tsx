"use client";

import { Loading03Icon, Search02Icon } from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { Button } from "@repo/design-system/components/ui/button";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
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
import { CountryFlag } from "@/components/country-flag";
import { Header } from "@/components/header";
import { Results } from "@/components/results";
import { countries, pathways, workModes } from "@/lib/options";

const skeletonColumns = [
  "select",
  "match",
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

/** Returns a selected form value or removes the neutral any option. */
function selected(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "");
  return value === "any" ? undefined : value;
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
    try {
      const started = await startSearch({
        ...(country ? { country } : {}),
        locale,
        ...(pathway ? { pathway } : {}),
        query,
        ...(workMode ? { workMode } : {}),
      });
      setActiveSearchId(started.searchId);
    } catch {
      toast.error(common("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <div className="space-y-6 border-b pb-8">
        <Header title={t("title")} />

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
          <div className="grid gap-2 sm:grid-cols-3">
            <Select
              defaultValue={profile?.desiredLocations[0] ?? "any"}
              name="country"
            >
              <SelectTrigger className="w-full" disabled={disabled}>
                <SelectValue placeholder={t("country")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t("anyCountry")}</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.value}>
                    <CountryFlag countryCode={country.code} />
                    {common(`countries.${country.code}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue={profile?.pathways[0] ?? "any"} name="pathway">
              <SelectTrigger className="w-full" disabled={disabled}>
                <SelectValue placeholder={t("pathway")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t("anyPathway")}</SelectItem>
                {pathways.map((pathway) => (
                  <SelectItem key={pathway} value={pathway}>
                    {t(pathway)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              defaultValue={profile?.workModes[0] ?? "any"}
              name="workMode"
            >
              <SelectTrigger className="w-full" disabled={disabled}>
                <SelectValue placeholder={t("workMode")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t("anyWorkMode")}</SelectItem>
                {workModes.map((workMode) => (
                  <SelectItem key={workMode} value={workMode}>
                    {t(workMode)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
      </div>

      <div aria-live="polite" className="min-h-56 pt-8">
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
        opportunities?.length ? (
          <Results records={opportunities} />
        ) : null}
        {!(hydrating || running) &&
        session?.status === "complete" &&
        opportunities?.length === 0 ? (
          <p className="rounded-md border p-4 text-muted-foreground text-sm">
            {t("noResults")}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/** Mirrors final table geometry while a background search is running. */
function SearchSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {skeletonColumns.map((column) => (
              <TableHead key={column}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {skeletonRows.map((row) => (
            <TableRow key={row}>
              {skeletonColumns.map((column) => (
                <TableCell key={`${row}-${column}`}>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
