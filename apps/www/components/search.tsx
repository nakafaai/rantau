"use client";

import { Opportunity } from "@/components/opportunity";
import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { useAction, useQuery } from "convex/react";
import { SearchIcon, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

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
      <header className="max-w-3xl space-y-3">
        <p className="font-semibold text-primary text-sm uppercase tracking-[0.16em]">
          {t("eyebrow")}
        </p>
        <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {t("description")}
        </p>
      </header>

      <form action={submit} className="flex max-w-4xl flex-col gap-3 sm:flex-row">
        <Input
          className="h-12 flex-1 rounded-xl bg-card px-4 shadow-sm"
          disabled={pending}
          minLength={3}
          name="query"
          placeholder={t("placeholder")}
          required
        />
        <Button className="h-12 rounded-xl px-6" disabled={pending} type="submit">
          {pending ? <Sparkles className="animate-pulse" /> : <SearchIcon />}
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
              <Opportunity key={record._id} record={record} />
            ))
          ) : (
            <Card>
              <CardContent className="text-muted-foreground">
                {t("noResults")}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="max-w-4xl border-dashed bg-muted/30 shadow-none">
          <CardHeader>
            <div className="mb-2 grid size-10 place-items-center rounded-full bg-secondary text-primary">
              <Sparkles className="size-5" />
            </div>
            <CardTitle>{t("emptyTitle")}</CardTitle>
            <CardDescription className="max-w-2xl leading-relaxed">
              {t("emptyBody")}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
  );
}
