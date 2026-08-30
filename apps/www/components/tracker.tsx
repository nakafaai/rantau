"use client";

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
import type { ApplicationStatus } from "@repo/domain/application";
import { nextApplicationStatuses } from "@repo/domain/application";
import { useMutation, useQuery } from "convex/react";
import { ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

/** Renders realtime application records and domain-valid status changes. */
export function Tracker() {
  const t = useTranslations("tracker");
  const common = useTranslations("common");
  const records = useQuery(api.applications.list);
  const transition = useMutation(api.applications.transition);
  const [pending, setPending] = useState<string | null>(null);

  /** Persists the selected domain-valid status and notes for one record. */
  async function update(formData: FormData) {
    const applicationId = String(formData.get("applicationId"));
    const status = String(formData.get("status")) as ApplicationStatus;
    const notes = String(formData.get("notes") ?? "");
    setPending(applicationId);
    try {
      await transition({
        applicationId: applicationId as Id<"applications">,
        notes,
        status,
      });
    } catch {
      toast.error(common("error"));
    } finally {
      setPending(null);
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

      {records?.length ? (
        <div className="grid gap-4">
          {records.map(({ application, opportunity }) => {
            const next = nextApplicationStatuses(application.status);
            return (
              <Card key={application._id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle>{opportunity.opportunity.title}</CardTitle>
                      <CardDescription>
                        {opportunity.opportunity.company} ·{" "}
                        {opportunity.opportunity.location}
                      </CardDescription>
                    </div>
                    <span className="rounded-full bg-secondary px-3 py-1 font-medium text-primary text-xs">
                      {t(application.status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <form
                    action={update}
                    className="grid gap-3 md:grid-cols-[1fr_12rem_auto]"
                  >
                    <input
                      name="applicationId"
                      type="hidden"
                      value={application._id}
                    />
                    <Input
                      defaultValue={application.notes}
                      name="notes"
                      placeholder={t("notes")}
                    />
                    <select
                      className="h-9 rounded-md border bg-background px-3 text-sm"
                      defaultValue={next[0] ?? application.status}
                      disabled={next.length === 0}
                      name="status"
                    >
                      {next.length ? (
                        next.map((status) => (
                          <option key={status} value={status}>
                            {t(status)}
                          </option>
                        ))
                      ) : (
                        <option value={application.status}>
                          {t(application.status)}
                        </option>
                      )}
                    </select>
                    <Button
                      disabled={
                        pending === application._id || next.length === 0
                      }
                      type="submit"
                    >
                      {t("update")}
                    </Button>
                  </form>
                  <a
                    className="mt-4 inline-flex items-center gap-1 font-medium text-primary text-sm hover:underline"
                    href={opportunity.opportunity.directApplyUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {opportunity.opportunity.source.name}{" "}
                    <ArrowUpRight className="size-4" />
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed bg-muted/30 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <BriefcaseBusiness className="size-8" />
            <p>{t("empty")}</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
