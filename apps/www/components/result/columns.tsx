"use client";

import { Button, Checkbox, Chip, Dropdown, Label, Link } from "@heroui/react";
import {
  ArrowUpRight01Icon,
  Bookmark01Icon,
  MoreVerticalIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  type RecommendationLevel,
  recommendationLevel,
} from "@repo/domain/rank";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { CountryFlag } from "@/components/country-flag";
import { PathwayBadge } from "@/components/opportunity/badge";
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

const matchLevelColor: Record<
  RecommendationLevel,
  "accent" | "default" | "success" | "warning"
> = {
  excellent: "success",
  fair: "warning",
  limited: "default",
  strong: "accent",
};

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
            aria-label={t("select-row")}
            isSelected={row.getIsSelected()}
            onChange={(value) => row.toggleSelected(value)}
            slot="selection"
            variant="secondary"
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
            </Checkbox.Content>
          </Checkbox>
        ),
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label={t("select-page")}
            isIndeterminate={table.getIsSomePageRowsSelected()}
            isSelected={table.getIsAllPageRowsSelected()}
            onChange={(value) => table.toggleAllPageRowsSelected(value)}
            slot="selection"
            variant="secondary"
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
            </Checkbox.Content>
          </Checkbox>
        ),
        id: "select",
      },
      {
        accessorKey: "recommendation",
        cell: ({ row }) => {
          const level = recommendationLevel(row.original.recommendation);
          return (
            <Chip color={matchLevelColor[level]} size="sm" variant="soft">
              {t(`match-level.${level}`)}
            </Chip>
          );
        },
        header: t("match"),
      },
      {
        accessorFn: (record) => record.opportunity.opportunity.title,
        cell: ({ row }) => {
          const { opportunity } = row.original.opportunity;
          return (
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
              <p className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-muted text-xs">
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
          <Link
            className="inline-flex items-center gap-1.5 font-medium hover:underline"
            href={row.original.opportunity.opportunity.source.url}
            rel="noreferrer"
            target="_blank"
          >
            <span>{row.original.opportunity.opportunity.company}</span>
            <HugeiconsIcon
              className="size-4 shrink-0"
              icon={ArrowUpRight01Icon}
              strokeWidth={2}
            />
          </Link>
        ),
        header: t("company"),
        id: "company",
      },
      {
        accessorFn: locationLabel,
        cell: ({ row }) => (
          <Link
            className="inline-flex items-center gap-1.5 hover:underline"
            href={mapsUrl(row.original)}
            rel="noreferrer"
            target="_blank"
          >
            <CountryFlag
              countryCode={row.original.opportunity.opportunity.countryCode}
            />
            <span>{locationLabel(row.original)}</span>
            <HugeiconsIcon
              className="size-4 shrink-0"
              icon={ArrowUpRight01Icon}
              strokeWidth={2}
            />
          </Link>
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
        header: t("work-mode"),
        id: "mode",
      },
      {
        accessorFn: (record) => record.opportunity.opportunity.salary ?? "",
        cell: ({ row }) => (
          <span>
            {row.original.opportunity.opportunity.salary ?? t("not-listed")}
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
          <Dropdown>
            <Button
              aria-label={t("actions")}
              className="ml-auto"
              isIconOnly
              size="sm"
              variant="tertiary"
            >
              <HugeiconsIcon
                className="size-4"
                icon={MoreVerticalIcon}
                strokeWidth={2}
              />
            </Button>
            <Dropdown.Popover placement="bottom end">
              <Dropdown.Menu
                onAction={(key) => {
                  if (key === "details") {
                    onDetails(row.original);
                  }
                  if (key === "save") {
                    onSave(row.original);
                  }
                }}
              >
                <Dropdown.Item id="details" textValue={t("details")}>
                  <HugeiconsIcon
                    className="size-4"
                    icon={ViewIcon}
                    strokeWidth={2}
                  />
                  <Label>{t("details")}</Label>
                </Dropdown.Item>
                <Dropdown.Item
                  id="save"
                  isDisabled={row.original.isSaved}
                  textValue={row.original.isSaved ? t("saved") : t("save")}
                >
                  <HugeiconsIcon
                    className="size-4"
                    icon={Bookmark01Icon}
                    strokeWidth={2}
                  />
                  <Label>{row.original.isSaved ? t("saved") : t("save")}</Label>
                </Dropdown.Item>
                <Dropdown.Item
                  href={row.original.opportunity.opportunity.directApplyUrl}
                  id="apply"
                  rel="noreferrer"
                  target="_blank"
                  textValue={t("apply")}
                >
                  <HugeiconsIcon
                    className="size-4"
                    icon={ArrowUpRight01Icon}
                    strokeWidth={2}
                  />
                  <Label>{t("apply")}</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        ),
        enableSorting: false,
        header: () => <span className="sr-only">{t("actions")}</span>,
        id: "actions",
      },
    ],
    [onDetails, onSave, t]
  );
}
