"use client";

import {
  ArrowUpRight01Icon,
  BriefcaseBusinessIcon,
  Building02Icon,
  Mail01Icon,
  MapsLocation01Icon,
} from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import { Badge } from "@repo/design-system/components/ui/badge";
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
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@repo/design-system/components/ui/sheet";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import {
  ApplicationStatus,
  nextApplicationStatuses,
} from "@repo/domain/application";
import { useAction, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Option, Schema } from "effect";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CountryFlag } from "@/components/country-flag";
import { Header } from "@/components/header";

type ApplicationRecord = FunctionReturnType<
  typeof api.applications.list
>[number];

const applicationColumns = [
  "role",
  "company",
  "location",
  "status",
  "actions",
] as const;
const applicationRows = ["first", "second", "third", "fourth"] as const;

/** Builds the most specific supported application location label. */
function locationLabel(record: ApplicationRecord) {
  const { city, country, location } = record.opportunity.opportunity;
  return [city, country].filter(Boolean).join(", ") || location;
}

/** Builds a Google Maps search link for an application location. */
function mapsUrl(record: ApplicationRecord) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLabel(record))}`;
}

/** Renders realtime applications as one scan-friendly shadcn table. */
export function Tracker() {
  const t = useTranslations("tracker");
  const common = useTranslations("common");
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
    <section>
      <div className="border-b pb-8">
        <Header
          actions={
            <Button
              className="shrink-0"
              disabled={mailPending || !profile || inbox === undefined}
              onClick={emailDigest}
              variant="outline"
            >
              <HugeIcons className="size-4" icon={Mail01Icon} />
              {t("mailButton")}
            </Button>
          }
          description={t("description")}
          title={t("title")}
        />
      </div>

      <div className="pt-8">
        {records === undefined ? <ApplicationSkeleton /> : null}
        {records?.length ? <ApplicationTable records={records} /> : null}
        {records?.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <HugeIcons className="size-4" icon={BriefcaseBusinessIcon} />
            <p>{t("empty")}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Renders application records with stable columns and row actions. */
function ApplicationTable({
  records,
}: {
  records: readonly ApplicationRecord[];
}) {
  const t = useTranslations("tracker");
  const search = useTranslations("search");

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{search("role")}</TableHead>
            <TableHead>{search("company")}</TableHead>
            <TableHead>{search("location")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>
              <span className="sr-only">{search("actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.application._id}>
              <TableCell className="min-w-52 whitespace-normal font-medium">
                {record.opportunity.opportunity.title}
              </TableCell>
              <TableCell className="min-w-36 whitespace-normal">
                <a
                  className="inline-flex items-center gap-1.5 font-medium hover:underline"
                  href={record.opportunity.opportunity.source.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <HugeIcons className="size-4" icon={Building02Icon} />
                  {record.opportunity.opportunity.company}
                  <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
                </a>
              </TableCell>
              <TableCell>
                <a
                  className="inline-flex max-w-52 items-center gap-1.5 whitespace-normal hover:underline"
                  href={mapsUrl(record)}
                  rel="noreferrer"
                  target="_blank"
                >
                  <CountryFlag
                    countryCode={record.opportunity.opportunity.countryCode}
                    fallback={
                      <HugeIcons className="size-4" icon={MapsLocation01Icon} />
                    }
                  />
                  {locationLabel(record)}
                  <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
                </a>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {t(record.application.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <ApplicationSheet record={record} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Shows one application's next valid transition in a shadcn Sheet. */
function ApplicationSheet({ record }: { record: ApplicationRecord }) {
  const t = useTranslations("tracker");
  const search = useTranslations("search");
  const common = useTranslations("common");
  const transition = useMutation(api.applications.transition);
  const [pending, setPending] = useState(false);
  const next = nextApplicationStatuses(record.application.status);
  const statusId = `status-${record.application._id}`;
  const notesId = `notes-${record.application._id}`;

  /** Saves one domain-valid status transition and its private notes. */
  async function update(formData: FormData) {
    const status = Option.getOrUndefined(
      Schema.decodeUnknownOption(ApplicationStatus)(formData.get("status"))
    );
    if (!status) {
      toast.error(common("error"));
      return;
    }
    setPending(true);
    const updated = await transition({
      applicationId: record.application._id,
      notes: String(formData.get("notes") ?? ""),
      status,
    }).then(
      () => true,
      () => false
    );
    setPending(false);
    if (!updated) {
      toast.error(common("error"));
      return;
    }
    toast.success(t("updated"));
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button className="ml-auto" size="sm" variant="outline">
            {search("details")}
          </Button>
        }
      />
      <SheetPopup className="sm:max-w-lg">
        <SheetHeader className="border-b pr-12">
          <Badge className="mb-2 w-fit" variant="secondary">
            {t(record.application.status)}
          </Badge>
          <SheetTitle>{record.opportunity.opportunity.title}</SheetTitle>
          <SheetDescription>
            {record.opportunity.opportunity.company} · {locationLabel(record)}
          </SheetDescription>
        </SheetHeader>
        <form action={update} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor={statusId}>
                {t("status")}
              </label>
              <Select
                defaultValue={next[0] ?? record.application.status}
                disabled={next.length === 0}
                name="status"
              >
                <SelectTrigger className="w-full" id={statusId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(next.length ? next : [record.application.status]).map(
                    (status) => (
                      <SelectItem key={status} value={status}>
                        {t(status)}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor={notesId}>
                {t("notes")}
              </label>
              <Input
                defaultValue={record.application.notes}
                id={notesId}
                maxLength={2000}
                name="notes"
              />
            </div>
          </div>
          <SheetFooter className="border-t sm:flex-row">
            <Button disabled={pending || next.length === 0} type="submit">
              {t("update")}
            </Button>
            <Button
              nativeButton={false}
              render={
                <a
                  aria-label={search("apply")}
                  href={record.opportunity.opportunity.directApplyUrl}
                  rel="noreferrer"
                  target="_blank"
                />
              }
              variant="outline"
            >
              {search("apply")}
              <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
            </Button>
          </SheetFooter>
        </form>
      </SheetPopup>
    </Sheet>
  );
}

/** Preserves the applications table geometry while Convex hydrates. */
function ApplicationSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {applicationColumns.map((column) => (
              <TableHead key={column}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {applicationRows.map((row) => (
            <TableRow key={row}>
              {applicationColumns.map((column) => (
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
