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
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { CountryFlag } from "@/components/country-flag";
import {
  locationLabel,
  mapsUrl,
  type OpportunityRecord,
  PathwayBadge,
} from "@/components/opportunity";
import { Source, SourceContent, SourceTrigger } from "@/components/source";

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
    <Button className="-ml-2" onClick={onClick} size="sm" variant="ghost">
      {label}
      <HugeIcons className="size-4" icon={ArrowUpDownIcon} />
    </Button>
  );
}

/** Builds the search-specific TanStack column contract. */
export function useResultColumns({ onDetails, onSave }: ResultActions) {
  const t = useTranslations("search");

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
            checked={
              table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : table.getIsAllPageRowsSelected()
            }
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
        cell: ({ row }) => (
          <div className="min-w-56 max-w-80 whitespace-normal">
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
          <a
            className="inline-flex max-w-48 items-center gap-1.5 whitespace-normal font-medium hover:underline"
            href={row.original.opportunity.opportunity.source.url}
            rel="noreferrer"
            target="_blank"
          >
            {row.original.opportunity.opportunity.company}
            <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
          </a>
        ),
        header: t("company"),
        id: "company",
      },
      {
        accessorFn: locationLabel,
        cell: ({ row }) => (
          <a
            className="inline-flex max-w-52 items-center gap-1.5 whitespace-normal hover:underline"
            href={mapsUrl(row.original)}
            rel="noreferrer"
            target="_blank"
          >
            <CountryFlag
              countryCode={row.original.opportunity.opportunity.countryCode}
            />
            {locationLabel(row.original)}
            <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
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
        cell: ({ row }) => t(row.original.opportunity.opportunity.workMode),
        header: t("workMode"),
        id: "mode",
      },
      {
        accessorFn: (record) => record.opportunity.opportunity.salary ?? "",
        cell: ({ row }) =>
          row.original.opportunity.opportunity.salary ?? t("notListed"),
        header: t("salary"),
        id: "salary",
      },
      {
        cell: ({ row }) => {
          const { opportunity } = row.original.opportunity;
          return (
            <Source href={opportunity.source.url}>
              <SourceTrigger label={opportunity.source.name} />
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
              <DropdownMenuItem onClick={() => onSave(row.original)}>
                <HugeIcons className="size-4" icon={Bookmark01Icon} />
                {t("save")}
              </DropdownMenuItem>
              <DropdownMenuItem
                render={
                  <a
                    href={row.original.opportunity.opportunity.directApplyUrl}
                    rel="noreferrer"
                    target="_blank"
                  />
                }
              >
                <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
                {t("apply")}
              </DropdownMenuItem>
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
