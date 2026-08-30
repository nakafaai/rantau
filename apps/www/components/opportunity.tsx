"use client";

import {
  AlertCircleIcon,
  ArrowUpRight01Icon,
  Bookmark01Icon,
  Building02Icon,
  CheckmarkCircle02Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Progress } from "@repo/design-system/components/ui/progress";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

type OpportunityRecord = FunctionReturnType<
  typeof api.opportunities.list
>[number];

type OpportunityProps = Readonly<{ record: OpportunityRecord }>;

/** Presents one sourced opportunity with readiness and direct apply actions. */
export function Opportunity({ record }: OpportunityProps) {
  const t = useTranslations("search");
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = useMutation(api.applications.save);
  const { opportunity: stored, readiness, readinessPercent } = record;
  const { opportunity } = stored;

  /** Saves this source-backed opportunity to the application tracker. */
  async function saveOpportunity() {
    try {
      await save({ opportunityId: stored._id });
      setSaved(true);
      toast.success(t("saved"));
    } catch {
      toast.error("Unable to save this opportunity.");
    }
  }

  return (
    <Card className="overflow-hidden py-0">
      <CardHeader className="gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{opportunity.pathway}</Badge>
          <Badge variant="outline">{opportunity.workMode}</Badge>
          <span className="ml-auto text-muted-foreground text-xs">
            {opportunity.source.name}
          </span>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl leading-snug">
            {opportunity.title}
          </CardTitle>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
            <span className="inline-flex items-center gap-1.5">
              <HugeIcons className="size-4" icon={Building02Icon} />
              {opportunity.company}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HugeIcons className="size-4" icon={Location01Icon} />
              {opportunity.location}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 px-5 sm:px-6">
        <p className="text-sm leading-relaxed">{opportunity.summary}</p>
        <div className="space-y-2 rounded-lg bg-muted p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {readinessPercent}% {t("readiness")}
            </span>
            <span className="text-muted-foreground">
              {readiness.length} {t("requirements").toLowerCase()}
            </span>
          </div>
          <Progress value={readinessPercent} />
        </div>
        {expanded ? (
          <div className="grid gap-6 border-t pt-5 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">{t("requirements")}</h3>
              <ul className="space-y-2 text-sm">
                {readiness.map((step) => (
                  <li
                    className="flex gap-2"
                    key={`${step.category}-${step.description}`}
                  >
                    {step.status === "ready" ? (
                      <HugeIcons
                        className="mt-0.5 size-4 text-success"
                        icon={CheckmarkCircle02Icon}
                      />
                    ) : (
                      <HugeIcons
                        className="mt-0.5 size-4 text-primary"
                        icon={AlertCircleIcon}
                      />
                    )}
                    <span>{step.description}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">{t("steps")}</h3>
              <ol className="space-y-2 text-sm">
                {opportunity.applicationSteps.map((step, index) => (
                  <li className="flex gap-2" key={step}>
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-secondary font-medium text-xs">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
        <Button
          className="h-auto w-fit p-0"
          onClick={() => setExpanded((value) => !value)}
          size="sm"
          variant="link"
        >
          {expanded ? t("hide") : t("requirements")}
        </Button>
      </CardContent>
      <CardFooter className="flex-wrap gap-2 border-t bg-muted/30 px-5 py-4 sm:px-6">
        <Button
          nativeButton={false}
          render={
            <a
              href={opportunity.directApplyUrl}
              rel="noreferrer"
              target="_blank"
            />
          }
        >
          {t("apply")} <HugeIcons icon={ArrowUpRight01Icon} />
        </Button>
        <Button disabled={saved} onClick={saveOpportunity} variant="outline">
          <HugeIcons icon={Bookmark01Icon} /> {saved ? t("saved") : t("save")}
        </Button>
        <a
          className="ml-auto truncate text-muted-foreground text-xs hover:text-foreground"
          href={opportunity.source.url}
          rel="noreferrer"
          target="_blank"
        >
          {t("source")}: {opportunity.source.name}
        </a>
      </CardFooter>
    </Card>
  );
}
