"use client";

import { Chip } from "@heroui/react";
import type { ApplicationStatus } from "@repo/domain/application";
import { useTranslations } from "next-intl";

const statusColor = {
  accepted: "success",
  applied: "accent",
  interview: "accent",
  offer: "warning",
  rejected: "danger",
  saved: "default",
  withdrawn: "warning",
} as const satisfies Record<
  ApplicationStatus,
  "accent" | "danger" | "default" | "success" | "warning"
>;

/** Renders a semantically distinct application status label. */
export function ApplicationStatusBadge({
  status,
}: Readonly<{ status: ApplicationStatus }>) {
  const t = useTranslations("tracker");

  return (
    <Chip color={statusColor[status]} size="sm" variant="soft">
      <Chip.Label>{t(status)}</Chip.Label>
    </Chip>
  );
}
