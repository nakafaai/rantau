"use client";

import { Chip } from "@heroui/react";
import { useTranslations } from "next-intl";
import type { OpportunityRecord } from "@/lib/opportunity";

const pathwayColors = {
  apprenticeship: "warning",
  ausbildung: "accent",
  internship: "success",
  job: "accent",
  vocational: "danger",
} as const;

/** Renders a color-distinct pathway badge for rapid scanning. */
export function PathwayBadge({ record }: { record: OpportunityRecord }) {
  const t = useTranslations("search");
  const {
    opportunity: { pathway },
  } = record.opportunity;

  return (
    <Chip color={pathwayColors[pathway]} size="sm" variant="soft">
      {t(pathway)}
    </Chip>
  );
}
