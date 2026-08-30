"use client";

import {
  BotIcon,
  Database01Icon,
  Mail01Icon,
  SearchCheckIcon,
} from "@hugeicons/core-free-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";

const capabilities = [
  {
    description: "convex",
    href: "https://www.convex.dev/pricing",
    icon: Database01Icon,
    name: "Convex",
  },
  {
    description: "firecrawl",
    href: "https://www.firecrawl.dev/pricing",
    icon: SearchCheckIcon,
    name: "Firecrawl",
  },
  {
    description: "gateway",
    href: "https://vercel.com/ai-gateway/models",
    icon: BotIcon,
    name: "Vercel AI Gateway",
  },
  {
    description: "agentmail",
    href: "https://www.agentmail.to/pricing",
    icon: Mail01Icon,
    name: "AgentMail",
  },
] as const;

/** Explains the component-first architecture and honest cost drivers. */
export function Costs() {
  const t = useTranslations("costs");
  const scenarios = [
    {
      description: t("starterBody"),
      lines: [
        t("starterFirecrawl"),
        t("starterGateway"),
        t("starterConvex"),
        t("starterAgentmail"),
      ],
      name: t("starter"),
      summary: t("starterCost"),
    },
    {
      description: t("growthBody"),
      lines: [
        t("growthFirecrawl"),
        t("growthGateway"),
        t("growthConvex"),
        t("growthAgentmail"),
      ],
      name: t("growth"),
      summary: t("growthCost"),
    },
  ];

  return (
    <section className="space-y-8">
      <Header description={t("description")} title={t("title")} />

      <div className="grid gap-4 sm:grid-cols-2">
        {capabilities.map(({ description, href, icon: Icon, name }) => (
          <a href={href} key={name} rel="noreferrer" target="_blank">
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <HugeIcons className="size-5" icon={Icon} />
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
        {scenarios.map(({ description, lines, name, summary }) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle>{name}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold text-xl leading-snug">{summary}</p>
              <ul className="space-y-2 text-muted-foreground text-sm">
                {lines.map((line) => (
                  <li className="flex gap-2" key={line}>
                    <span aria-hidden="true" className="text-primary">
                      •
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="max-w-3xl text-muted-foreground text-sm">{t("note")}</p>
    </section>
  );
}
