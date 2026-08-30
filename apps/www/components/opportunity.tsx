"use client";

import {
  AlertCircleIcon,
  ArrowUpRight01Icon,
  Bookmark01Icon,
  Building02Icon,
  CheckmarkCircle02Icon,
  MapsLocation01Icon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/design-system/components/ui/sheet";
import { readinessCounts } from "@repo/domain/readiness";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CountryFlag } from "@/components/country-flag";
import { Source, SourceContent, SourceTrigger } from "@/components/source";
import { useSaveApplication } from "@/hooks/applications";
import {
  locationLabel,
  mapsUrl,
  type OpportunityRecord,
} from "@/lib/opportunity";

const pathwayColors = {
  apprenticeship:
    "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  ausbildung:
    "border-violet-500/40 bg-violet-500/10 text-violet-800 dark:text-violet-300",
  internship:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  job: "border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-300",
  vocational:
    "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300",
} as const;

/** Renders a color-distinct pathway badge for rapid scanning. */
export function PathwayBadge({ record }: { record: OpportunityRecord }) {
  const t = useTranslations("search");
  const {
    opportunity: { pathway },
  } = record.opportunity;
  return (
    <Badge className={pathwayColors[pathway]} variant="outline">
      {t(pathway)}
    </Badge>
  );
}

type OpportunitySheetProps = Readonly<{
  onOpenChange: (open: boolean) => void;
  open: boolean;
  record: OpportunityRecord | null;
}>;

/** Shows one opportunity's source-backed detail in a wide Shadcn Sheet. */
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
  const counts = readinessCounts(readiness);
  let readinessText = t("requirementsUnknown");
  if (counts.total > 0) {
    readinessText = hasProfile
      ? t("readinessCount", counts)
      : t("profileNeeded", { count: counts.total });
  }

  /** Saves the active source-backed opportunity. */
  async function saveOpportunity() {
    try {
      await save({ opportunityId: stored._id });
      toast.success(t("saved"));
    } catch {
      toast.error(common("error"));
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader className="border-b pr-12">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <PathwayBadge record={record} />
            <Badge variant="outline">{t(opportunity.workMode)}</Badge>
            <CountryFlag countryCode={opportunity.countryCode} />
          </div>
          <SheetTitle>{opportunity.title}</SheetTitle>
          <SheetDescription className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
            <a
              className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline"
              href={opportunity.source.url}
              rel="noreferrer"
              target="_blank"
            >
              <HugeIcons className="size-4" icon={Building02Icon} />
              {opportunity.company}
              <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
            </a>
            <a
              className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline"
              href={mapsUrl(record)}
              rel="noreferrer"
              target="_blank"
            >
              <HugeIcons className="size-4" icon={MapsLocation01Icon} />
              {locationLabel(record)}
              <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
            </a>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-7 overflow-y-auto px-4 pb-6">
          <p className="text-sm leading-relaxed">{opportunity.summary}</p>

          <section className="space-y-3">
            <h3 className="font-medium text-sm">{t("readiness")}</h3>
            <p className="text-muted-foreground text-sm">{readinessText}</p>
            {readiness.length ? (
              <ul className="space-y-2 text-sm">
                {readiness.map((step) => (
                  <li
                    className="flex items-start gap-2"
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
                    <span className="leading-relaxed">{step.description}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="space-y-3">
            <h3 className="font-medium text-sm">{t("steps")}</h3>
            <ol className="list-decimal space-y-2 pl-5 text-sm marker:font-medium marker:text-muted-foreground">
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
              <ul className="divide-y rounded-md border text-sm">
                {opportunity.support.map((resource) => (
                  <li
                    className="space-y-1 p-3"
                    key={`${resource.name}-${resource.description}`}
                  >
                    {resource.url ? (
                      <a
                        className="inline-flex items-center gap-1 font-medium hover:underline"
                        href={resource.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {resource.name}
                        <HugeIcons
                          className="size-4"
                          icon={ArrowUpRight01Icon}
                        />
                      </a>
                    ) : (
                      <span className="font-medium">{resource.name}</span>
                    )}
                    <p className="text-muted-foreground leading-relaxed">
                      {resource.description}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="space-y-2 border-t pt-5">
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
        </div>

        <SheetFooter className="border-t sm:flex-row">
          <Button
            nativeButton={false}
            render={
              <a
                aria-label={t("apply")}
                href={opportunity.directApplyUrl}
                rel="noreferrer"
                target="_blank"
              />
            }
          >
            {t("apply")}
            <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
          </Button>
          <Button
            disabled={record.isSaved}
            onClick={saveOpportunity}
            variant="outline"
          >
            <HugeIcons className="size-4" icon={Bookmark01Icon} />
            {record.isSaved ? t("saved") : t("save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
