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
import { type MouseEvent, Suspense } from "react";
import { Account } from "@/components/account";
import { Profile } from "@/components/profile";
import { Search } from "@/components/search";
import { Tracker } from "@/components/tracker";
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

/** Renders the persistent Nakafa workspace around a route-owned page. */
export function Shell() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const route = workspaceRoute(pathname);

  return (
    <SidebarProvider>
      <WorkspaceFrame route={route} title={t(route)} />
    </SidebarProvider>
  );
}

/** Selects the current workspace view without remounting shared providers. */
function WorkspacePage({ route }: Readonly<{ route: WorkspaceRoute }>) {
  if (route === "profile") {
    return <Profile />;
  }
  if (route === "applications") {
    return <Tracker />;
  }
  return (
    <Suspense>
      <Search />
    </Suspense>
  );
}

type WorkspaceFrameProps = Readonly<{
  route: WorkspaceRoute;
  title: string;
}>;

/** Composes the responsive workspace body and sidebar without remounting them. */
function WorkspaceFrame({ route, title }: WorkspaceFrameProps) {
  return (
    <>
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b bg-background lg:hidden">
          <div className="flex w-full items-center gap-3 px-4">
            <SidebarTrigger />
            <p className="truncate font-medium text-sm">{title}</p>
          </div>
        </header>
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
          <WorkspacePage route={route} />
        </div>
      </SidebarInset>
      <AppSidebar activeRoute={route} containerClassName="order-first" />
    </>
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

  /** Pushes one semantic workspace link through the native history API. */
  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (event.currentTarget.target && event.currentTarget.target !== "_self")
    ) {
      return;
    }
    event.preventDefault();
    setOpenMobile(false);
    const url = new URL(event.currentTarget.href);
    const destination = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (destination !== current) {
      window.history.pushState(null, "", destination);
    }
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
                  onClick={navigate}
                />
              }
              size="lg"
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-md border bg-background shadow-xs">
                <HugeIcons className="size-4" icon={BriefcaseBusinessIcon} />
              </div>
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
                        onClick={navigate}
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
          <Account onNavigate={navigate} />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
