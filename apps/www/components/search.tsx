"use client";

import { Loading03Icon, Search02Icon } from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { Button } from "@repo/design-system/components/ui/button";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Input } from "@repo/design-system/components/ui/input";
import { OpportunityPathway, WorkMode } from "@repo/domain/opportunity";
import { useMutation, useQuery } from "convex/react";
import { Option, Schema } from "effect";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Filters } from "@/components/filters";
import { Results } from "@/components/results";

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
  const startSearch = useMutation(api.opportunities.start);
  const profile = useQuery(api.profiles.get);
  const latest = useQuery(api.searches.latest);
  const [activeSearchId, setActiveSearchId] = useState<Id<"searches"> | null>(
    null
  );
  const searchId = activeSearchId ?? latest?._id;
  const session = useQuery(api.searches.get, searchId ? { searchId } : "skip");
  const opportunities = useQuery(
    api.opportunities.list,
    searchId ? { searchId } : "skip"
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
      <header className="z-10 shrink-0 border-b bg-background">
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
        className="mx-auto flex min-h-0 w-full min-w-0 max-w-[90rem] flex-1 px-4 py-4 sm:px-6"
      >
        <Results
          failed={session?.status === "failed"}
          key={searchId ?? "latest"}
          loading={hydrating || (Boolean(searchId) && !opportunities)}
          records={opportunities ?? []}
          running={running}
        />
      </div>
    </section>
  );
}
