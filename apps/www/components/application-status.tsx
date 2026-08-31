"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import type { ApplicationStatus } from "@repo/domain/application";
import { useTranslations } from "next-intl";

const statusClassName = {
  accepted:
    "border-success/60 bg-success/15 text-emerald-800 dark:text-success",
  applied: "border-primary/50 bg-primary/10 text-primary",
  interview:
    "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  offer: "border-warning/70 bg-warning/15 text-amber-800 dark:text-warning",
  rejected: "border-destructive/60 bg-destructive/10 text-destructive",
  saved: "border-border bg-muted/50 text-muted-foreground",
  withdrawn:
    "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-300",
} as const satisfies Record<ApplicationStatus, string>;

/** Renders a semantically distinct application status label. */
export function ApplicationStatusBadge({
  status,
}: Readonly<{ status: ApplicationStatus }>) {
  const t = useTranslations("tracker");

  return (
    <Badge className={statusClassName[status]} variant="outline">
      {t(status)}
    </Badge>
  );
}
