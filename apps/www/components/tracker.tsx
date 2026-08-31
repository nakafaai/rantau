"use client";

import {
  Button,
  EmptyState,
  Link,
  Skeleton,
  Table,
  Tooltip,
  toast,
} from "@heroui/react";
import {
  ArrowUpRight01Icon,
  BriefcaseBusinessIcon,
  Loading03Icon,
  Mail01Icon,
  MapsLocation01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { api } from "@repo/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
    return "w-[28rem] min-w-[28rem] px-4";
  }
  if (column === "company") {
    return "w-80 min-w-80 px-4";
  }
  if (column === "location") {
    return "w-80 min-w-80 px-4";
  }
  if (column === "status") {
    return region === "header" ? "w-44 min-w-44 after:hidden" : "w-44 min-w-44";
  }
  if (column === "actions") {
    return region === "header"
      ? "sticky right-0 z-30 w-16 min-w-16 max-w-16 border-s border-separator/50 bg-surface-secondary px-3"
      : "sticky right-0 z-20 w-16 min-w-16 max-w-16 border-s border-separator/50 bg-surface px-3";
  }
  return "";
}

/** Renders one application row with direct links and a pinned action. */
function ApplicationRow({ record }: Readonly<{ record: ApplicationRecord }>) {
  const { opportunity } = record.opportunity;

  return (
    <Table.Row className="group h-16" id={record.application._id}>
      <Table.Cell className={applicationColumnClass("role")}>
        <div>
          <Link
            className="inline-flex items-center gap-1.5 font-medium hover:underline"
            href={opportunity.directApplyUrl}
            rel="noreferrer"
            target="_blank"
          >
            {opportunity.title}
            <HugeiconsIcon
              className="size-4 shrink-0"
              icon={ArrowUpRight01Icon}
              strokeWidth={2}
            />
          </Link>
          <p className="mt-0.5 text-muted text-xs">
            {opportunity.employmentType}
          </p>
        </div>
      </Table.Cell>
      <Table.Cell className={applicationColumnClass("company")}>
        <Link
          className="inline-flex items-center gap-1.5 hover:underline"
          href={opportunity.source.url}
          rel="noreferrer"
          target="_blank"
        >
          {opportunity.company}
          <HugeiconsIcon
            className="size-4 shrink-0"
            icon={ArrowUpRight01Icon}
            strokeWidth={2}
          />
        </Link>
      </Table.Cell>
      <Table.Cell className={applicationColumnClass("location")}>
        <Link
          className="inline-flex items-center gap-1.5 hover:underline"
          href={applicationMapsUrl(record)}
          rel="noreferrer"
          target="_blank"
        >
          <CountryFlag
            countryCode={opportunity.countryCode}
            fallback={
              <HugeiconsIcon
                className="size-4"
                icon={MapsLocation01Icon}
                strokeWidth={2}
              />
            }
          />
          {applicationLocation(record)}
          <HugeiconsIcon
            className="size-4 shrink-0"
            icon={ArrowUpRight01Icon}
            strokeWidth={2}
          />
        </Link>
      </Table.Cell>
      <Table.Cell className={applicationColumnClass("status")}>
        <ApplicationStatusBadge status={record.application.status} />
      </Table.Cell>
      <Table.Cell className={applicationColumnClass("actions")}>
        <ApplicationSheet record={record} />
      </Table.Cell>
    </Table.Row>
  );
}

/** Renders stable application rows while Convex hydrates. */
function ApplicationLoadingRows() {
  return LOADING_ROW_KEYS.slice(0, LOADING_ROWS).map((rowKey) => (
    <Table.Row className="h-16" id={`loading-${rowKey}`} key={rowKey}>
      {(["role", "company", "location", "status", "actions"] as const).map(
        (column) => (
          <Table.Cell
            className={applicationColumnClass(column)}
            key={`${rowKey}-${column}`}
          >
            <Skeleton
              className={column === "actions" ? "mx-auto size-4" : "h-4 w-2/3"}
            />
          </Table.Cell>
        )
      )}
    </Table.Row>
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
      toast.danger(common("error"));
      return;
    }
    toast.success(t("mailSent"));
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Header
        actions={
          <Tooltip delay={200}>
            <Button
              isPending={mailPending}
              onPress={emailDigest}
              size="sm"
              variant="secondary"
            >
              <HugeiconsIcon
                className={mailPending ? "size-4 animate-spin" : "size-4"}
                icon={mailPending ? Loading03Icon : Mail01Icon}
                strokeWidth={2}
              />
              <span className="hidden sm:inline">{t("mailButton")}</span>
            </Button>
            <Tooltip.Content>{t("mailBody")}</Tooltip.Content>
          </Tooltip>
        }
        title={t("title")}
      />
      <div className="mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 px-4 py-4 sm:px-6">
        <Table className="min-h-0 w-full min-w-0 flex-1 grid-rows-[minmax(0,1fr)_auto]">
          <Table.ScrollContainer className="h-full min-h-0 overflow-auto overscroll-contain [container-type:inline-size]">
            <Table.Content
              aria-label={t("title")}
              className={
                records === undefined || records.length
                  ? "min-w-[82rem] table-auto"
                  : "h-full min-w-full table-auto"
              }
            >
              <Table.Header>
                <Table.Column
                  className={applicationColumnClass("role", "header")}
                  id="role"
                  isRowHeader
                >
                  {search("role")}
                </Table.Column>
                <Table.Column
                  className={applicationColumnClass("company", "header")}
                  id="company"
                >
                  {search("company")}
                </Table.Column>
                <Table.Column
                  className={applicationColumnClass("location", "header")}
                  id="location"
                >
                  {search("location")}
                </Table.Column>
                <Table.Column
                  className={applicationColumnClass("status", "header")}
                  id="status"
                >
                  {t("status")}
                </Table.Column>
                <Table.Column
                  className={applicationColumnClass("actions", "header")}
                  id="actions"
                >
                  <span className="sr-only">{search("actions")}</span>
                </Table.Column>
              </Table.Header>
              <Table.Body
                renderEmptyState={() => (
                  <EmptyState className="sticky left-0 flex h-full min-h-40 w-[100cqw] flex-col items-center justify-center gap-4 px-6 text-center text-muted text-sm">
                    <HugeiconsIcon
                      className="size-5"
                      icon={BriefcaseBusinessIcon}
                      strokeWidth={2}
                    />
                    {t("empty")}
                  </EmptyState>
                )}
              >
                {records === undefined ? <ApplicationLoadingRows /> : null}
                {records?.map((record) => (
                  <ApplicationRow
                    key={record.application._id}
                    record={record}
                  />
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
          <Table.Footer className="min-h-12 text-muted text-sm">
            {records === undefined ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              t("applicationCount", { count: records.length })
            )}
          </Table.Footer>
        </Table>
      </div>
    </section>
  );
}
