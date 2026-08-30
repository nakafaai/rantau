"use client";

import {
  ArrowUpRight01Icon,
  BriefcaseBusinessIcon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
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
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Input } from "@repo/design-system/components/ui/input";
import type { ApplicationStatus } from "@repo/domain/application";
import { nextApplicationStatuses } from "@repo/domain/application";
import { useAction, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/header";

/** Renders realtime application records and domain-valid status changes. */
export function Tracker() {
  const t = useTranslations("tracker");
  const common = useTranslations("common");
  const records = useQuery(api.applications.list);
  const profile = useQuery(api.profiles.get);
  const inbox = useQuery(api.mail.inbox);
  const provision = useAction(api.mail.provision);
  const sendDigest = useMutation(api.mail.sendDigest);
  const transition = useMutation(api.applications.transition);
  const [mailPending, setMailPending] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  /** Provisions a private inbox when needed and sends the latest digest. */
  async function emailDigest() {
    setMailPending(true);
    try {
      if (!inbox) {
        await provision({});
      }
      await sendDigest({});
      toast.success(t("mailSent"));
    } catch {
      toast.error(common("error"));
    } finally {
      setMailPending(false);
    }
  }

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
      <Header description={t("description")} title={t("title")} />

      <Card className="bg-muted/30 shadow-none">
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <HugeIcons className="mt-0.5 size-5" icon={Mail01Icon} />
            <div className="space-y-1">
              <p className="font-semibold">{t("mailTitle")}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {profile ? t("mailBody") : t("mailProfile")}
              </p>
            </div>
          </div>
          <Button
            className="shrink-0"
            disabled={mailPending || !profile || inbox === undefined}
            onClick={emailDigest}
            variant="outline"
          >
            <HugeIcons icon={Mail01Icon} /> {t("mailButton")}
          </Button>
        </CardContent>
      </Card>

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
                    <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <HugeIcons icon={BriefcaseBusinessIcon} />
          <p>{t("empty")}</p>
        </div>
      )}
    </section>
  );
}
