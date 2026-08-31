"use client";

import {
  Button,
  buttonVariants,
  Chip,
  Drawer,
  Link,
  Surface,
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
import { Source, SourceContent, SourceTrigger } from "@/components/source";
import { useSaveApplication } from "@/hooks/applications";
import {
  locationLabel,
  mapsUrl,
  type OpportunityRecord,
} from "@/lib/opportunity";

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
  let readinessText = t("requirementsUnknown");
  if (readiness.length > 0) {
    readinessText = hasProfile ? t("readinessCompared") : t("profileNeeded");
  }

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
        <Drawer.Dialog className="w-full max-w-2xl sm:w-[42rem]">
          <Drawer.CloseTrigger />
          <Drawer.Header className="pe-8">
            <div className="flex flex-wrap items-center gap-2">
              <PathwayBadge record={record} />
              <Chip size="sm" variant="soft">
                {t(opportunity.workMode)}
              </Chip>
              <CountryFlag countryCode={opportunity.countryCode} />
            </div>
            <Drawer.Heading className="font-semibold text-lg">
              {opportunity.title}
            </Drawer.Heading>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-muted text-sm">
              <Link
                href={opportunity.source.url}
                rel="noreferrer"
                target="_blank"
              >
                <HugeiconsIcon
                  className="size-4"
                  icon={Building02Icon}
                  strokeWidth={2}
                />
                {opportunity.company}
                <Link.Icon>
                  <HugeiconsIcon
                    className="size-4"
                    icon={ArrowUpRight01Icon}
                    strokeWidth={2}
                  />
                </Link.Icon>
              </Link>
              <Link href={mapsUrl(record)} rel="noreferrer" target="_blank">
                <HugeiconsIcon
                  className="size-4"
                  icon={MapsLocation01Icon}
                  strokeWidth={2}
                />
                {locationLabel(record)}
                <Link.Icon>
                  <HugeiconsIcon
                    className="size-4"
                    icon={ArrowUpRight01Icon}
                    strokeWidth={2}
                  />
                </Link.Icon>
              </Link>
            </div>
          </Drawer.Header>

          <Drawer.Body className="space-y-7">
            <p className="text-foreground leading-relaxed">
              {opportunity.summary}
            </p>

            <section className="space-y-3">
              <h3 className="font-medium text-sm">{t("readiness")}</h3>
              <p className="text-muted text-sm">{readinessText}</p>
              {readiness.length ? (
                <ul className="space-y-2 text-sm">
                  {readiness.map((step) => (
                    <li
                      className="flex items-start gap-2"
                      key={`${step.category}-${step.description}`}
                    >
                      <HugeiconsIcon
                        className={
                          step.status === "ready"
                            ? "mt-0.5 size-4 text-success"
                            : "mt-0.5 size-4 text-accent"
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
                        className="mt-0.5"
                        color={step.status === "ready" ? "success" : "warning"}
                        size="sm"
                        variant="soft"
                      >
                        {step.status === "ready"
                          ? t("readyRequirement")
                          : t("reviewRequirement")}
                      </Chip>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section className="space-y-3">
              <h3 className="font-medium text-sm">{t("steps")}</h3>
              <ol className="list-decimal space-y-2 pl-5 text-sm marker:font-medium marker:text-muted">
                {opportunity.applicationSteps.map((step) => (
                  <li className="pl-1 leading-relaxed" key={step}>
                    {step}
                  </li>
                ))}
              </ol>
            </section>

            {opportunity.support.length ? (
              <section className="space-y-3">
                <h3 className="font-medium text-sm">{t("support")}</h3>
                <div className="grid gap-2 text-sm">
                  {opportunity.support.map((resource) => (
                    <Surface
                      className="space-y-1 rounded-2xl p-4"
                      key={`${resource.name}-${resource.description}`}
                      variant="secondary"
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
                    </Surface>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-2">
              <h3 className="font-medium text-sm">{t("source")}</h3>
              <Source href={opportunity.source.url}>
                <SourceTrigger label={opportunity.source.name} />
                <SourceContent
                  description={opportunity.summary}
                  kind={opportunity.source.kind}
                  title={opportunity.title}
                />
              </Source>
            </section>
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
