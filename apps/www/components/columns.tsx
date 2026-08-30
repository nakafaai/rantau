"use client";

import {
  ArrowUpDownIcon,
  ArrowUpRight01Icon,
  Bookmark01Icon,
  MoreVerticalIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@repo/design-system/components/ui/button";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { CountryFlag } from "@/components/country-flag";
import { PathwayBadge } from "@/components/opportunity";
import { Source, SourceContent, SourceTrigger } from "@/components/source";
import {
  locationLabel,
  mapsUrl,
  type OpportunityRecord,
} from "@/lib/opportunity";

type ResultActions = Readonly<{
  onDetails: (record: OpportunityRecord) => void;
  onSave: (record: OpportunityRecord) => void;
}>;

/** Renders a sortable table heading. */
function SortButton({
  label,
  onClick,
}: Readonly<{ label: string; onClick: () => void }>) {
  return (
    <Button
      className="-ml-2 w-auto justify-start whitespace-nowrap"
      onClick={onClick}
      size="sm"
      variant="ghost"
    >
      <span>{label}</span>
      <HugeIcons className="size-4" icon={ArrowUpDownIcon} />
    </Button>
  );
}

/** Builds the search-specific TanStack column contract. */
export function useResultColumns({ onDetails, onSave }: ResultActions) {
  "use no memo";

  const t = useTranslations("search");

  // TanStack Table requires stable column identity across controlled state updates.
  // react-doctor-disable-next-line react-doctor/react-compiler-no-manual-memoization
  return useMemo<ColumnDef<OpportunityRecord>[]>(
    () => [
      {
        cell: ({ row }) => (
          <Checkbox
            aria-label={t("selectRow")}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
          />
        ),
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label={t("selectPage")}
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(Boolean(value))
            }
          />
        ),
        id: "select",
      },
      {
        accessorKey: "recommendation",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {row.original.recommendation}%
          </span>
        ),
        header: ({ column }) => (
          <SortButton
            label={t("match")}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
      },
      {
        accessorFn: (record) => record.opportunity.opportunity.title,
        cell: ({ row }) => {
          const { opportunity } = row.original.opportunity;
          return (
            <div>
              <a
                className="inline-flex items-center gap-1.5 font-medium hover:underline"
                href={opportunity.directApplyUrl}
                rel="noreferrer"
                target="_blank"
              >
                {opportunity.title}
                <HugeIcons
                  className="size-4 shrink-0"
                  icon={ArrowUpRight01Icon}
                />
              </a>
              <p className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-muted-foreground text-xs">
                <span className="shrink-0">{opportunity.employmentType}</span>
                <span aria-hidden="true" className="md:hidden">
                  ·
                </span>
                <span className="hidden truncate md:hidden min-[420px]:inline">
                  {opportunity.company}
                </span>
                <CountryFlag
                  className="ml-0.5 md:hidden"
                  countryCode={opportunity.countryCode}
                />
                <span className="hidden truncate md:hidden min-[520px]:inline">
                  {locationLabel(row.original)}
                </span>
              </p>
            </div>
          );
        },
        header: t("role"),
        id: "role",
      },
      {
        accessorFn: (record) => record.opportunity.opportunity.company,
        cell: ({ row }) => (
          <a
            className="inline-flex items-center gap-1.5 font-medium hover:underline"
            href={row.original.opportunity.opportunity.source.url}
            rel="noreferrer"
            target="_blank"
          >
            <span>{row.original.opportunity.opportunity.company}</span>
            <HugeIcons className="size-4 shrink-0" icon={ArrowUpRight01Icon} />
          </a>
        ),
        header: t("company"),
        id: "company",
      },
      {
        accessorFn: locationLabel,
        cell: ({ row }) => (
          <a
            className="inline-flex items-center gap-1.5 hover:underline"
            href={mapsUrl(row.original)}
            rel="noreferrer"
            target="_blank"
          >
            <CountryFlag
              countryCode={row.original.opportunity.opportunity.countryCode}
            />
            <span>{locationLabel(row.original)}</span>
            <HugeIcons className="size-4 shrink-0" icon={ArrowUpRight01Icon} />
          </a>
        ),
        header: t("location"),
        id: "location",
      },
      {
        accessorFn: (record) => record.opportunity.opportunity.pathway,
        cell: ({ row }) => <PathwayBadge record={row.original} />,
        header: t("pathway"),
        id: "pathway",
      },
      {
        accessorFn: (record) => record.opportunity.opportunity.workMode,
        cell: ({ row }) => (
          <span>{t(row.original.opportunity.opportunity.workMode)}</span>
        ),
        header: t("workMode"),
        id: "mode",
      },
      {
        accessorFn: (record) => record.opportunity.opportunity.salary ?? "",
        cell: ({ row }) => (
          <span>
            {row.original.opportunity.opportunity.salary ?? t("notListed")}
          </span>
        ),
        header: t("salary"),
        id: "salary",
      },
      {
        cell: ({ row }) => {
          const { opportunity } = row.original.opportunity;
          return (
            <Source href={opportunity.source.url}>
              <SourceTrigger
                className="max-w-full"
                label={opportunity.source.name}
              />
              <SourceContent
                description={opportunity.summary}
                kind={opportunity.source.kind}
                title={opportunity.title}
              />
            </Source>
          );
        },
        header: t("source"),
        id: "source",
      },
      {
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label={t("actions")}
                  className="ml-auto"
                  size="icon-sm"
                  variant="ghost"
                />
              }
            >
              <HugeIcons className="size-4" icon={MoreVerticalIcon} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onDetails(row.original)}>
                <HugeIcons className="size-4" icon={ViewIcon} />
                {t("details")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={row.original.isSaved}
                onClick={() => onSave(row.original)}
              >
                <HugeIcons className="size-4" icon={Bookmark01Icon} />
                {row.original.isSaved ? t("saved") : t("save")}
              </DropdownMenuItem>
              <DropdownMenuLinkItem
                render={
                  <a
                    aria-label={t("apply")}
                    href={row.original.opportunity.opportunity.directApplyUrl}
                    rel="noreferrer"
                    target="_blank"
                  />
                }
              >
                <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
                {t("apply")}
              </DropdownMenuLinkItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
        header: () => <span className="sr-only">{t("actions")}</span>,
        id: "actions",
      },
    ],
    [onDetails, onSave, t]
  );
}
