"use client";

import { Breadcrumbs, cn } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { workspacePath } from "@/lib/locale";

type HeaderProps = Readonly<{
  actions?: ReactNode;
  className?: string;
  title: string;
}>;

/** Renders the compact workspace breadcrumb and page actions. */
export function Header({ actions, className, title }: HeaderProps) {
  const common = useTranslations("common");
  const locale = useLocale() === "id" ? "id" : "en";
  const searchHref = workspacePath(locale, "search");

  return (
    <header className={cn("shrink-0", className)}>
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <h1 className="sr-only">{title}</h1>
        <Breadcrumbs className="min-w-0 flex-1">
          <Breadcrumbs.Item className="min-w-0 truncate" href={searchHref}>
            {common("workspace")}
          </Breadcrumbs.Item>
          <Breadcrumbs.Item className="min-w-0 truncate">
            {title}
          </Breadcrumbs.Item>
        </Breadcrumbs>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
