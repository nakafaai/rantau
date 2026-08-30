"use client";

import {
  BriefcaseBusinessIcon,
  FileUserIcon,
  Search02Icon,
} from "@hugeicons/core-free-icons";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@repo/design-system/components/ui/sidebar-content";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuDescription,
  SidebarMenuItem,
} from "@repo/design-system/components/ui/sidebar-menu";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar-provider";
import {
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "@repo/design-system/components/ui/sidebar-shell";
import { useSidebar } from "@repo/design-system/lib/sidebar/context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Account } from "@/components/account";
import {
  type WorkspaceRoute,
  workspacePath,
  workspaceRoute,
} from "@/lib/locale";

const destinations = [
  { icon: Search02Icon, route: "search" },
  { icon: FileUserIcon, route: "profile" },
  { icon: BriefcaseBusinessIcon, route: "applications" },
] as const satisfies ReadonlyArray<{
  icon: typeof Search02Icon;
  route: WorkspaceRoute;
}>;

type ShellProps = Readonly<{ children: ReactNode }>;

/** Renders the persistent Nakafa workspace around a route-owned page. */
export function Shell({ children }: ShellProps) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const route = workspaceRoute(pathname);

  return (
    <SidebarProvider>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background lg:hidden">
          <div className="flex w-full items-center gap-3 px-6">
            <SidebarTrigger className="size-9" variant="outline" />
            <p className="truncate font-medium text-sm">{t(route)}</p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-12">
          {children}
        </main>
      </SidebarInset>
      <AppSidebar activeRoute={route} containerClassName="order-first" />
    </SidebarProvider>
  );
}

type AppSidebarProps = Readonly<{
  activeRoute: WorkspaceRoute;
  containerClassName?: string;
}>;

/** Renders clean route navigation and the consolidated account footer. */
function AppSidebar({ activeRoute, containerClassName }: AppSidebarProps) {
  const t = useTranslations("common");
  const locale = useLocale() === "id" ? "id" : "en";
  const { setOpenMobile } = useSidebar();

  /** Closes the mobile sheet after a destination is selected. */
  function closeMobile() {
    setOpenMobile(false);
  }

  return (
    <Sidebar className="z-20" containerClassName={containerClassName}>
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link
                  href={workspacePath(locale, "search")}
                  onClick={closeMobile}
                />
              }
              size="lg"
            >
              <HugeIcons className="size-4" icon={BriefcaseBusinessIcon} />
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <p className="truncate font-medium">{t("brand")}</p>
                <SidebarMenuDescription>{t("tagline")}</SidebarMenuDescription>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("workspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {destinations.map(({ icon, route }) => (
                <SidebarMenuItem key={route}>
                  <SidebarMenuButton
                    isActive={activeRoute === route}
                    render={
                      <Link
                        href={workspacePath(locale, route)}
                        onClick={closeMobile}
                      />
                    }
                    tooltip={t(route)}
                  >
                    <HugeIcons className="size-4" icon={icon} />
                    <span>{t(route)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <Account />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
