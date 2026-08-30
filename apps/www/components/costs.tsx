"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Bot, Database, Mail, SearchCheck } from "lucide-react";
import { useTranslations } from "next-intl";

const capabilities = [
  {
    description: "convex",
    href: "https://www.convex.dev/pricing",
    icon: Database,
    name: "Convex",
  },
  {
    description: "firecrawl",
    href: "https://www.firecrawl.dev/pricing",
    icon: SearchCheck,
    name: "Firecrawl",
  },
  {
    description: "gateway",
    href: "https://vercel.com/ai-gateway/models",
    icon: Bot,
    name: "Vercel AI Gateway",
  },
  {
    description: "agentmail",
    href: "https://www.agentmail.to/pricing",
    icon: Mail,
    name: "AgentMail",
  },
] as const;

/** Explains the component-first architecture and honest cost drivers. */
export function Costs() {
  const t = useTranslations("costs");

  return (
    <section className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <p className="font-semibold text-primary text-sm uppercase tracking-[0.16em]">
          {t("eyebrow")}
        </p>
        <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {t("description")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {capabilities.map(({ description, href, icon: Icon, name }) => (
          <a href={href} key={name} rel="noreferrer" target="_blank">
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="mb-2 grid size-10 place-items-center rounded-full bg-secondary text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{name}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {t(description)}
                </CardDescription>
              </CardHeader>
            </Card>
          </a>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("starter")}</CardTitle>
            <CardDescription>{t("starterBody")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-2xl">{t("variable")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("growth")}</CardTitle>
            <CardDescription>{t("growthBody")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-2xl">{t("variable")}</p>
          </CardContent>
        </Card>
      </div>
      <p className="max-w-3xl text-muted-foreground text-sm">{t("note")}</p>
    </section>
  );
}
