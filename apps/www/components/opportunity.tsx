"use client";

import { api } from "@repo/backend/convex/_generated/api";
import type { Doc } from "@repo/backend/convex/_generated/dataModel";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Progress } from "@repo/design-system/components/ui/progress";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowUpRight,
  Bookmark,
  Building2,
  CheckCircle2,
  CircleAlert,
  MapPin,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

type OpportunityProps = Readonly<{ record: Doc<"opportunities"> }>;

/** Presents one sourced opportunity with readiness and direct apply actions. */
export function Opportunity({ record }: OpportunityProps) {
  const t = useTranslations("search");
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = useMutation(api.applications.save);
  const detail = useQuery(api.opportunities.detail, {
    opportunityId: record._id,
  });
  const opportunity = record.opportunity;

  /** Saves this source-backed opportunity to the application tracker. */
  async function saveOpportunity() {
    try {
      await save({ opportunityId: record._id });
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
              <Building2 className="size-4" /> {opportunity.company}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" /> {opportunity.location}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 px-5 sm:px-6">
        <p className="text-sm leading-relaxed">{opportunity.summary}</p>
        {detail ? (
          <div className="space-y-2 rounded-lg bg-muted p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {detail.readinessPercent}% {t("readiness")}
              </span>
              <span className="text-muted-foreground">
                {detail.readiness.length} {t("requirements").toLowerCase()}
              </span>
            </div>
            <Progress value={detail.readinessPercent} />
          </div>
        ) : null}
        {expanded ? (
          <div className="grid gap-6 border-t pt-5 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">{t("requirements")}</h3>
              <ul className="space-y-2 text-sm">
                {detail?.readiness.map((step) => (
                  <li className="flex gap-2" key={`${step.category}-${step.description}`}>
                    {step.status === "ready" ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <CircleAlert className="mt-0.5 size-4 shrink-0 text-primary" />
                    )}
                    <span>{step.description}</span>
                  </li>
                )) ?? null}
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
        <button
          className="font-medium text-primary text-sm hover:underline"
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          {expanded ? "Hide details" : t("requirements")}
        </button>
      </CardContent>
      <CardFooter className="flex-wrap gap-2 border-t bg-muted/30 px-5 py-4 sm:px-6">
        <Button asChild>
          <a href={opportunity.directApplyUrl} rel="noreferrer" target="_blank">
            {t("apply")} <ArrowUpRight />
          </a>
        </Button>
        <Button disabled={saved} onClick={saveOpportunity} variant="outline">
          <Bookmark /> {saved ? t("saved") : t("save")}
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
