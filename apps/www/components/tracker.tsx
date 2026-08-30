"use client";

import {
  ArrowUpRight01Icon,
  BriefcaseBusinessIcon,
  Building02Icon,
  Loading03Icon,
  Mail01Icon,
  MapsLocation01Icon,
} from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import { Badge } from "@repo/design-system/components/ui/badge";
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
import { useAction, useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ApplicationSheet } from "@/components/application-sheet";
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

/** Returns responsive widths for application table columns. */
function applicationColumnClass(column: string) {
  if (column === "company") {
    return "hidden w-44 md:table-cell";
  }
  if (column === "location") {
    return "hidden w-52 lg:table-cell";
  }
  if (column === "status") {
    return "w-28";
  }
  if (column === "actions") {
    return "w-9 px-1";
  }
  return "min-w-0";
}

/** Renders one application row without wrapping dense table text. */
function ApplicationRow({ record }: Readonly<{ record: ApplicationRecord }>) {
  const t = useTranslations("tracker");
  const { opportunity } = record.opportunity;

  return (
    <TableRow className="h-14">
      <TableCell className={applicationColumnClass("role")}>
        <div className="min-w-0">
          <p className="truncate font-medium">{opportunity.title}</p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-muted-foreground text-xs">
            <span className="truncate md:hidden">{opportunity.company}</span>
            <CountryFlag
              className="ml-0.5 lg:hidden"
              countryCode={opportunity.countryCode}
            />
            <span className="hidden truncate md:hidden min-[520px]:inline">
              {applicationLocation(record)}
            </span>
          </p>
        </div>
      </TableCell>
      <TableCell className={applicationColumnClass("company")}>
        <a
          className="flex min-w-0 items-center gap-1.5 hover:underline"
          href={opportunity.source.url}
          rel="noreferrer"
          target="_blank"
        >
          <HugeIcons className="size-4 shrink-0" icon={Building02Icon} />
          <span className="truncate">{opportunity.company}</span>
          <HugeIcons className="size-4 shrink-0" icon={ArrowUpRight01Icon} />
        </a>
      </TableCell>
      <TableCell className={applicationColumnClass("location")}>
        <a
          className="flex min-w-0 items-center gap-1.5 hover:underline"
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
          <span className="truncate">{applicationLocation(record)}</span>
          <HugeIcons className="size-4 shrink-0" icon={ArrowUpRight01Icon} />
        </a>
      </TableCell>
      <TableCell className={applicationColumnClass("status")}>
        <Badge className="max-w-full truncate" variant="secondary">
          {t(record.application.status)}
        </Badge>
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
            <Skeleton className="h-4 w-2/3" />
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
  const profile = useQuery(api.profiles.get);
  const inbox = useQuery(api.mail.inbox);
  const provision = useAction(api.mail.provision);
  const sendDigest = useMutation(api.mail.sendDigest);
  const [mailPending, setMailPending] = useState(false);

  /** Provisions a private inbox when needed and sends the latest digest. */
  async function emailDigest() {
    setMailPending(true);
    const sent = await (inbox ? Promise.resolve() : provision({}))
      .then(() => sendDigest({}))
      .then(
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
            disabled={mailPending || !profile || inbox === undefined}
            onClick={emailDigest}
            size="sm"
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
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 px-4 py-4 sm:px-6">
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border">
          <Table
            className="table-fixed"
            containerClassName="min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
          >
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className={applicationColumnClass("role")}>
                  {search("role")}
                </TableHead>
                <TableHead className={applicationColumnClass("company")}>
                  {search("company")}
                </TableHead>
                <TableHead className={applicationColumnClass("location")}>
                  {search("location")}
                </TableHead>
                <TableHead className={applicationColumnClass("status")}>
                  {t("status")}
                </TableHead>
                <TableHead className={applicationColumnClass("actions")}>
                  <span className="sr-only">{search("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records === undefined ? <ApplicationLoadingRows /> : null}
              {records?.map((record) => (
                <ApplicationRow key={record.application._id} record={record} />
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
