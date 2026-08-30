"use client";

import {
  AlertCircleIcon,
  ArrowUpRight01Icon,
  Bookmark01Icon,
  Building02Icon,
  CheckmarkCircle02Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@repo/design-system/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { readinessCounts } from "@repo/domain/readiness";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CountryFlag } from "@/components/country-flag";

type OpportunityRecord = FunctionReturnType<
  typeof api.opportunities.list
>[number];

type ResultsProps = Readonly<{ records: readonly OpportunityRecord[] }>;

/** Builds the clearest supported city and country label for a result row. */
function locationLabel(record: OpportunityRecord) {
  const { city, country, location } = record.opportunity.opportunity;
  return [city, country].filter(Boolean).join(", ") || location;
}

/** Renders scan-friendly opportunities using shadcn Table and TanStack Table. */
export function Results({ records }: ResultsProps) {
  const t = useTranslations("search");
  const [filter, setFilter] = useState("");
  const columns: ColumnDef<OpportunityRecord>[] = [
    {
      accessorFn: (record) => record.opportunity.opportunity.title,
      cell: ({ row }) => (
        <div className="min-w-52 whitespace-normal">
          <p className="font-medium leading-snug">
            {row.original.opportunity.opportunity.title}
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            {row.original.opportunity.opportunity.employmentType}
          </p>
        </div>
      ),
      header: t("role"),
      id: "role",
    },
    {
      accessorFn: (record) => record.opportunity.opportunity.company,
      cell: ({ row }) => (
        <span className="inline-flex max-w-44 items-center gap-2 whitespace-normal">
          <HugeIcons className="size-4" icon={Building02Icon} />
          {row.original.opportunity.opportunity.company}
        </span>
      ),
      header: t("company"),
      id: "company",
    },
    {
      accessorFn: locationLabel,
      cell: ({ row }) => (
        <span className="inline-flex max-w-44 items-center gap-2 whitespace-normal">
          <CountryFlag
            countryCode={row.original.opportunity.opportunity.countryCode}
            fallback={<HugeIcons className="size-4" icon={Location01Icon} />}
          />
          {locationLabel(row.original)}
        </span>
      ),
      header: t("location"),
      id: "location",
    },
    {
      accessorFn: (record) => record.opportunity.opportunity.pathway,
      cell: ({ row }) => (
        <Badge variant="secondary">
          {t(row.original.opportunity.opportunity.pathway)}
        </Badge>
      ),
      header: t("pathway"),
      id: "pathway",
    },
    {
      cell: ({ row }) => <OpportunitySheet record={row.original} />,
      header: () => <span className="sr-only">{t("actions")}</span>,
      id: "actions",
    },
  ];
  const table = useReactTable({
    columns,
    data: [...records],
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    onGlobalFilterChange: setFilter,
    state: { globalFilter: filter },
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {records.length} {t("results")}
        </p>
        <Input
          className="sm:max-w-64"
          onChange={(event) => setFilter(event.target.value)}
          placeholder={t("filterResults")}
          value={filter}
        />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  {t("noFilteredResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** Shows one opportunity's full source-backed detail in a shadcn Sheet. */
function OpportunitySheet({ record }: { record: OpportunityRecord }) {
  const t = useTranslations("search");
  const common = useTranslations("common");
  const save = useMutation(api.applications.save);
  const [saved, setSaved] = useState(false);
  const { opportunity: stored, readiness, hasProfile } = record;
  const { opportunity } = stored;
  const counts = readinessCounts(readiness);
  let readinessText = t("requirementsUnknown");
  if (counts.total > 0) {
    readinessText = hasProfile
      ? t("readinessCount", counts)
      : t("profileNeeded", { count: counts.total });
  }

  /** Saves the current source-backed opportunity to the application tracker. */
  async function saveOpportunity() {
    try {
      await save({ opportunityId: stored._id });
      setSaved(true);
      toast.success(t("saved"));
    } catch {
      toast.error(common("error"));
    }
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button className="ml-auto" size="sm" variant="outline">
            {t("details")}
          </Button>
        }
      />
      <SheetPopup className="sm:max-w-lg">
        <SheetHeader className="border-b pr-12">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{opportunity.pathway}</Badge>
            <Badge variant="outline">{opportunity.workMode}</Badge>
          </div>
          <SheetTitle>{opportunity.title}</SheetTitle>
          <SheetDescription>
            {opportunity.company} · {locationLabel(record)}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
          <p className="text-sm leading-relaxed">{opportunity.summary}</p>

          <section className="space-y-3">
            <h3 className="font-medium text-sm">{t("readiness")}</h3>
            <p className="text-muted-foreground text-sm">{readinessText}</p>
            {readiness.length ? (
              <ul className="space-y-2 text-sm">
                {readiness.map((step) => (
                  <li
                    className="flex gap-2"
                    key={`${step.category}-${step.description}`}
                  >
                    <HugeIcons
                      className={
                        step.status === "ready"
                          ? "mt-0.5 size-4 text-success"
                          : "mt-0.5 size-4 text-primary"
                      }
                      icon={
                        step.status === "ready"
                          ? CheckmarkCircle02Icon
                          : AlertCircleIcon
                      }
                    />
                    <span>{step.description}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="space-y-3">
            <h3 className="font-medium text-sm">{t("steps")}</h3>
            <ol className="space-y-2 text-sm">
              {opportunity.applicationSteps.map((step, index) => (
                <li className="flex gap-2" key={step}>
                  <span className="grid size-4 shrink-0 place-items-center rounded-full bg-secondary font-medium text-[10px]">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {opportunity.support.length ? (
            <section className="space-y-3">
              <h3 className="font-medium text-sm">{t("support")}</h3>
              <ul className="space-y-2 text-sm">
                {opportunity.support.map((resource) => (
                  <li key={`${resource.name}-${resource.description}`}>
                    {resource.url ? (
                      <a
                        className="font-medium text-primary hover:underline"
                        href={resource.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {resource.name}
                      </a>
                    ) : (
                      <span className="font-medium">{resource.name}</span>
                    )}
                    <p className="text-muted-foreground">
                      {resource.description}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <a
            className="block truncate text-muted-foreground text-xs hover:text-foreground"
            href={opportunity.source.url}
            rel="noreferrer"
            target="_blank"
          >
            {t("source")}: {opportunity.source.name}
          </a>
        </div>
        <SheetFooter className="border-t sm:flex-row">
          <Button
            nativeButton={false}
            render={
              <a
                href={opportunity.directApplyUrl}
                rel="noreferrer"
                target="_blank"
              />
            }
          >
            {t("apply")}
            <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
          </Button>
          <Button disabled={saved} onClick={saveOpportunity} variant="outline">
            <HugeIcons className="size-4" icon={Bookmark01Icon} />
            {saved ? t("saved") : t("save")}
          </Button>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}
