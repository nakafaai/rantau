"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/design-system/components/ui/breadcrumb";
import { cn } from "@repo/design-system/lib/utils";
import Link from "next/link";
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

  return (
    <header className={cn("shrink-0 border-b", className)}>
      <div className="mx-auto flex min-h-14 w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <h1 className="sr-only">{title}</h1>
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbLink
                className="truncate"
                render={<Link href={workspacePath(locale, "search")} />}
              >
                {common("workspace")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
