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

/** Returns responsive widths and visibility for one result column. */
export function resultColumnClass(columnId: string) {
  if (columnId === "select") {
    return "w-10 px-2";
  }
  if (columnId === "recommendation") {
    return "hidden w-32 lg:table-cell";
  }
  if (columnId === "company") {
    return "hidden w-44 md:table-cell";
  }
  if (columnId === "location") {
    return "hidden w-52 lg:table-cell";
  }
  if (columnId === "pathway") {
    return "w-28";
  }
  if (columnId === "mode") {
    return "hidden w-24 xl:table-cell";
  }
  if (columnId === "salary") {
    return "hidden w-40 2xl:table-cell";
  }
  if (columnId === "source") {
    return "hidden w-40 2xl:table-cell";
  }
  if (columnId === "actions") {
    return "w-10 px-1";
  }
  return "min-w-0";
}

/** Renders a sortable table heading. */
function SortButton({
  label,
  onClick,
}: Readonly<{ label: string; onClick: () => void }>) {
  return (
    <Button
      className="-ml-2 w-full min-w-0 justify-start overflow-hidden"
      onClick={onClick}
      size="sm"
      variant="ghost"
    >
      <span className="truncate">{label}</span>
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
          <div className="min-w-0">
            <p className="truncate font-medium">
              {row.original.opportunity.opportunity.title}
            </p>
            <p className="mt-0.5 truncate text-muted-foreground text-xs">
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
            className="flex w-full min-w-0 items-center gap-1.5 font-medium hover:underline"
            href={row.original.opportunity.opportunity.source.url}
            rel="noreferrer"
            target="_blank"
          >
            <span className="truncate">
              {row.original.opportunity.opportunity.company}
            </span>
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
            className="flex w-full min-w-0 items-center gap-1.5 hover:underline"
            href={mapsUrl(row.original)}
            rel="noreferrer"
            target="_blank"
          >
            <CountryFlag
              countryCode={row.original.opportunity.opportunity.countryCode}
            />
            <span className="truncate">{locationLabel(row.original)}</span>
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
        cell: ({ row }) => (
          <span className="block truncate">
            {t(row.original.opportunity.opportunity.workMode)}
          </span>
        ),
        header: t("workMode"),
        id: "mode",
      },
      {
        accessorFn: (record) => record.opportunity.opportunity.salary ?? "",
        cell: ({ row }) => (
          <span className="block truncate">
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
              <DropdownMenuItem onClick={() => onSave(row.original)}>
                <HugeIcons className="size-4" icon={Bookmark01Icon} />
                {t("save")}
              </DropdownMenuItem>
              <DropdownMenuItem
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
