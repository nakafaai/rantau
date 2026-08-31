"use client";

import {
  Alert,
  Button,
  buttonVariants,
  Card,
  Chip,
  Drawer,
  Link,
  toast,
} from "@heroui/react";
import {
  AlertCircleIcon,
  ArrowUpRight01Icon,
  Bookmark01Icon,
  Building02Icon,
  CheckmarkCircle02Icon,
  MapsLocation01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { CountryFlag } from "@/components/country-flag";
import { PathwayBadge } from "@/components/opportunity/badge";
import { useSaveApplication } from "@/hooks/applications";
import {
  locationLabel,
  mapsUrl,
  type OpportunityRecord,
} from "@/lib/opportunity";

type OpportunitySheetProps = Readonly<{
  onOpenChange: (open: boolean) => void;
  open: boolean;
  record: OpportunityRecord | null;
}>;

/** Shows one opportunity's source-backed detail in an animated HeroUI drawer. */
export function OpportunitySheet({
  onOpenChange,
  open,
  record,
}: OpportunitySheetProps) {
  const t = useTranslations("search");
  const common = useTranslations("common");
  const save = useSaveApplication();

  if (!record) {
    return null;
  }

  const { opportunity: stored, readiness, hasProfile } = record;
  const { opportunity } = stored;
  const readinessText = hasProfile
    ? t("readiness-compared")
    : t("profile-needed");

  /** Saves the active source-backed opportunity. */
  async function saveOpportunity() {
    try {
      await save({ opportunityId: stored._id });
      toast.success(t("saved"));
    } catch {
      toast.danger(common("error"));
    }
  }

  return (
    <Drawer.Backdrop isOpen={open} onOpenChange={onOpenChange}>
      <Drawer.Content placement="right">
        <Drawer.Dialog className="w-full max-w-xl sm:w-[36rem]">
          <Drawer.CloseTrigger />
          <Drawer.Header className="pe-8">
            <div className="flex flex-wrap items-center gap-2">
              <PathwayBadge record={record} />
              <Chip size="sm" variant="soft">
                {t(opportunity.workMode)}
              </Chip>
            </div>
            <Drawer.Heading className="font-semibold text-lg">
              {opportunity.title}
            </Drawer.Heading>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-muted text-sm">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <HugeiconsIcon
                  aria-hidden="true"
                  className="size-4 shrink-0"
                  icon={Building02Icon}
                  strokeWidth={2}
                />
                <span className="truncate">{opportunity.company}</span>
              </span>
              <Link href={mapsUrl(record)} rel="noreferrer" target="_blank">
                <CountryFlag
                  countryCode={opportunity.countryCode}
                  fallback={
                    <HugeiconsIcon
                      aria-hidden="true"
                      className="size-4"
                      icon={MapsLocation01Icon}
                      strokeWidth={2}
                    />
                  }
                />
                {locationLabel(record)}
                <Link.Icon>
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="size-4"
                    icon={ArrowUpRight01Icon}
                    strokeWidth={2}
                  />
                </Link.Icon>
              </Link>
              <Link
                href={opportunity.source.url}
                rel="noreferrer"
                target="_blank"
              >
                {opportunity.source.name}
                <Link.Icon>
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="size-4"
                    icon={ArrowUpRight01Icon}
                    strokeWidth={2}
                  />
                </Link.Icon>
              </Link>
            </div>
          </Drawer.Header>

          <Drawer.Body className="grid content-start gap-4">
            <p className="px-1 text-foreground leading-relaxed">
              {opportunity.summary}
            </p>

            {readiness.length ? (
              <Card>
                <Card.Header>
                  <Card.Title>{t("readiness")}</Card.Title>
                  <Card.Description>{readinessText}</Card.Description>
                </Card.Header>
                <Card.Content>
                  <ul className="divide-y divide-separator text-sm">
                    {readiness.map((step) => (
                      <li
                        className="flex items-start gap-2 py-3 first:pt-1 last:pb-1"
                        key={`${step.category}-${step.description}`}
                      >
                        <HugeiconsIcon
                          aria-hidden="true"
                          className={
                            step.status === "ready"
                              ? "mt-0.5 size-4 shrink-0 text-success"
                              : "mt-0.5 size-4 shrink-0 text-accent"
                          }
                          icon={
                            step.status === "ready"
                              ? CheckmarkCircle02Icon
                              : AlertCircleIcon
                          }
                          strokeWidth={2}
                        />
                        <span className="min-w-0 flex-1 leading-relaxed">
                          {step.description}
                        </span>
                        <Chip
                          className="mt-0.5 shrink-0"
                          color={
                            step.status === "ready" ? "success" : "warning"
                          }
                          size="sm"
                          variant="soft"
                        >
                          {step.status === "ready"
                            ? t("ready-requirement")
                            : t("review-requirement")}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                </Card.Content>
              </Card>
            ) : (
              <Alert>
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{t("requirements-unavailable")}</Alert.Title>
                  <Alert.Description>
                    {t("requirements-unknown")}
                  </Alert.Description>
                </Alert.Content>
              </Alert>
            )}

            <Card>
              <Card.Header>
                <Card.Title>{t("steps")}</Card.Title>
              </Card.Header>
              <Card.Content>
                <ol className="grid gap-3 text-sm">
                  {opportunity.applicationSteps.map((step, index) => (
                    <li
                      className="grid grid-cols-[auto_1fr] items-start gap-3"
                      key={step}
                    >
                      <span className="grid size-7 place-items-center rounded-full bg-surface-secondary font-medium text-xs">
                        {index + 1}
                      </span>
                      <span className="pt-1 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </Card.Content>
            </Card>

            {opportunity.support.length ? (
              <Card>
                <Card.Header>
                  <Card.Title>{t("support")}</Card.Title>
                </Card.Header>
                <Card.Content className="divide-y divide-separator">
                  {opportunity.support.map((resource) => (
                    <div
                      className="space-y-1 py-3 first:pt-1 last:pb-1"
                      key={`${resource.name}-${resource.description}`}
                    >
                      {resource.url ? (
                        <Link
                          className="inline-flex items-center gap-1 font-medium hover:underline"
                          href={resource.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {resource.name}
                          <HugeiconsIcon
                            aria-hidden="true"
                            className="size-4"
                            icon={ArrowUpRight01Icon}
                            strokeWidth={2}
                          />
                        </Link>
                      ) : (
                        <span className="font-medium">{resource.name}</span>
                      )}
                      <p className="text-muted leading-relaxed">
                        {resource.description}
                      </p>
                    </div>
                  ))}
                </Card.Content>
              </Card>
            ) : null}
          </Drawer.Body>

          <Drawer.Footer>
            <Link
              aria-label={t("apply")}
              className={buttonVariants({ variant: "primary" })}
              href={opportunity.directApplyUrl}
              rel="noreferrer"
              target="_blank"
            >
              {t("apply")}
              <HugeiconsIcon
                className="size-4"
                icon={ArrowUpRight01Icon}
                strokeWidth={2}
              />
            </Link>
            <Button
              isDisabled={record.isSaved}
              onPress={saveOpportunity}
              variant="secondary"
            >
              <HugeiconsIcon
                className="size-4"
                icon={Bookmark01Icon}
                strokeWidth={2}
              />
              {record.isSaved ? t("saved") : t("save")}
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
