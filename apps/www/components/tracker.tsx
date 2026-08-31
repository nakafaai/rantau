"use client";

import {
  ArrowUpRight01Icon,
  BriefcaseBusinessIcon,
  Loading03Icon,
  Mail01Icon,
  MapsLocation01Icon,
} from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import { Button } from "@repo/design-system/components/ui/button";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ApplicationSheet } from "@/components/application-sheet";
import { ApplicationStatusBadge } from "@/components/application-status";
import { CountryFlag } from "@/components/country-flag";
import { Header } from "@/components/header";
import {
  type ApplicationRecord,
  applicationLocation,
  applicationMapsUrl,
} from "@/lib/application";

const LOADING_ROWS = 5;
const LOADING_ROW_KEYS = [
  "alpha",
  "bravo",
  "charlie",
  "delta",
  "echo",
] as const;

type ApplicationColumnRegion = "body" | "header";

/** Returns readable widths, spacing, and pinning for application columns. */
function applicationColumnClass(
  column: string,
  region: ApplicationColumnRegion = "body"
) {
  if (column === "role") {
    return "min-w-64 px-3";
  }
  if (column === "company") {
    return "min-w-64 px-3";
  }
  if (column === "location") {
    return "min-w-64 px-3";
  }
  if (column === "status") {
    return "min-w-40 px-3";
  }
  if (column === "actions") {
    const layer = region === "header" ? "z-40" : "z-20";
    return `sticky right-0 ${layer} w-11 min-w-11 max-w-11 overflow-hidden bg-background px-2 shadow-[inset_0_-1px_0_var(--border)] group-hover:bg-muted`;
  }
  return "px-3";
}

/** Renders one application row with direct links and a pinned action. */
function ApplicationRow({ record }: Readonly<{ record: ApplicationRecord }>) {
  const { opportunity } = record.opportunity;

  return (
    <TableRow className="group h-14">
      <TableCell className={applicationColumnClass("role")}>
        <div>
          <a
            className="inline-flex items-center gap-1.5 font-medium hover:underline"
            href={opportunity.directApplyUrl}
            rel="noreferrer"
            target="_blank"
          >
            {opportunity.title}
            <HugeIcons className="size-4 shrink-0" icon={ArrowUpRight01Icon} />
          </a>
          <p className="mt-0.5 text-muted-foreground text-xs">
            {opportunity.employmentType}
          </p>
        </div>
      </TableCell>
      <TableCell className={applicationColumnClass("company")}>
        <a
          className="inline-flex items-center gap-1.5 hover:underline"
          href={opportunity.source.url}
          rel="noreferrer"
          target="_blank"
        >
          {opportunity.company}
          <HugeIcons className="size-4 shrink-0" icon={ArrowUpRight01Icon} />
        </a>
      </TableCell>
      <TableCell className={applicationColumnClass("location")}>
        <a
          className="inline-flex items-center gap-1.5 hover:underline"
          href={applicationMapsUrl(record)}
          rel="noreferrer"
          target="_blank"
        >
          <CountryFlag
            countryCode={opportunity.countryCode}
            fallback={
              <HugeIcons className="size-4" icon={MapsLocation01Icon} />
            }
          />
          {applicationLocation(record)}
          <HugeIcons className="size-4 shrink-0" icon={ArrowUpRight01Icon} />
        </a>
      </TableCell>
      <TableCell className={applicationColumnClass("status")}>
        <ApplicationStatusBadge status={record.application.status} />
      </TableCell>
      <TableCell className={applicationColumnClass("actions")}>
        <ApplicationSheet record={record} />
      </TableCell>
    </TableRow>
  );
}

/** Renders stable application rows while Convex hydrates. */
function ApplicationLoadingRows() {
  return LOADING_ROW_KEYS.slice(0, LOADING_ROWS).map((rowKey) => (
    <TableRow className="h-14 hover:bg-transparent" key={rowKey}>
      {(["role", "company", "location", "status", "actions"] as const).map(
        (column) => (
          <TableCell
            className={applicationColumnClass(column)}
            key={`${rowKey}-${column}`}
          >
            <Skeleton
              className={column === "actions" ? "mx-auto size-4" : "h-4 w-2/3"}
            />
          </TableCell>
        )
      )}
    </TableRow>
  ));
}

/** Renders applications as one responsive header, body, and footer table. */
export function Tracker() {
  const t = useTranslations("tracker");
  const common = useTranslations("common");
  const search = useTranslations("search");
  const records = useQuery(api.applications.list);
  const sendDigest = useMutation(api.mail.sendDigest);
  const [mailPending, setMailPending] = useState(false);

  /** Queues the latest application digest for the account email. */
  async function emailDigest() {
    setMailPending(true);
    const sent = await sendDigest({}).then(
      () => true,
      () => false
    );
    setMailPending(false);
    if (!sent) {
      toast.error(common("error"));
      return;
    }
    toast.success(t("mailSent"));
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Header
        actions={
          <Button
            disabled={mailPending}
            onClick={emailDigest}
            size="sm"
            title={t("mailBody")}
            variant="outline"
          >
            <HugeIcons
              className={mailPending ? "size-4 animate-spin" : "size-4"}
              icon={mailPending ? Loading03Icon : Mail01Icon}
            />
            <span className="hidden sm:inline">{t("mailButton")}</span>
          </Button>
        }
        title={t("title")}
      />
      <div className="mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 px-4 py-4 sm:px-6">
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border">
          <div className="relative min-h-0 flex-1">
            <Table
              className="min-w-full table-auto"
              containerClassName="h-full min-h-0 overflow-x-auto overflow-y-scroll overscroll-contain [scrollbar-width:thin]"
            >
              <TableHeader className="sticky top-0 z-30 bg-background">
                <TableRow>
                  <TableHead
                    className={applicationColumnClass("role", "header")}
                  >
                    {search("role")}
                  </TableHead>
                  <TableHead
                    className={applicationColumnClass("company", "header")}
                  >
                    {search("company")}
                  </TableHead>
                  <TableHead
                    className={applicationColumnClass("location", "header")}
                  >
                    {search("location")}
                  </TableHead>
                  <TableHead
                    className={applicationColumnClass("status", "header")}
                  >
                    {t("status")}
                  </TableHead>
                  <TableHead
                    className={applicationColumnClass("actions", "header")}
                  >
                    <span className="sr-only">{search("actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records === undefined ? <ApplicationLoadingRows /> : null}
                {records?.map((record) => (
                  <ApplicationRow
                    key={record.application._id}
                    record={record}
                  />
                ))}
                {records?.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-24 text-center" colSpan={5}>
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <HugeIcons
                          className="size-4"
                          icon={BriefcaseBusinessIcon}
                        />
                        {t("empty")}
                      </span>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-11 z-40 w-px bg-border"
              data-slot="applications-action-divider"
            />
          </div>
          <footer className="flex min-h-12 shrink-0 items-center border-t bg-muted/20 px-3 py-2 text-muted-foreground text-sm">
            {records === undefined ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              t("applicationCount", { count: records.length })
            )}
          </footer>
        </div>
      </div>
    </section>
  );
}
