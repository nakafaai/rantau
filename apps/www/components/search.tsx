"use client";

import { Loading03Icon, Search02Icon } from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { Button } from "@repo/design-system/components/ui/button";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Input } from "@repo/design-system/components/ui/input";
import { useAction, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { Opportunity } from "@/components/opportunity";

/** Runs evidence-backed discovery and renders direct-source results. */
export function Search() {
  const t = useTranslations("search");
  const common = useTranslations("common");
  const locale = useLocale() === "id" ? "id" : "en";
  const runSearch = useAction(api.opportunities.search);
  const [searchId, setSearchId] = useState<Id<"searches"> | null>(null);
  const [pending, setPending] = useState(false);
  const opportunities = useQuery(
    api.opportunities.list,
    searchId ? { searchId } : "skip"
  );

  /** Sends one normalized natural-language query to the Convex action. */
  async function submit(formData: FormData) {
    const query = String(formData.get("query") ?? "").trim();
    if (query.length < 3) {
      return;
    }
    setPending(true);
    try {
      const result = await runSearch({ locale, query });
      setSearchId(result.searchId);
    } catch {
      toast.error(common("error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-8">
      <Header title={t("title")} />

      <form action={submit} className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          disabled={pending}
          minLength={3}
          name="query"
          placeholder={t("placeholder")}
          required
        />
        <Button disabled={pending} type="submit">
          <HugeIcons
            className={pending ? "animate-spin" : undefined}
            icon={pending ? Loading03Icon : Search02Icon}
          />
          {pending ? t("working") : t("button")}
        </Button>
      </form>

      {searchId && opportunities ? (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {opportunities.length} {t("results")}
          </p>
          {opportunities.length ? (
            opportunities.map((record) => (
              <Opportunity key={record.opportunity._id} record={record} />
            ))
          ) : (
            <p className="text-muted-foreground text-sm">{t("noResults")}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
