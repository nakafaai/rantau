"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import {
  BriefcaseBusinessIcon,
  FileUserIcon,
  InformationCircleIcon,
  LanguageSquareIcon,
  Logout01Icon,
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
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Costs } from "@/components/costs";
import { Profile } from "@/components/profile";
import { Search } from "@/components/search";
import { Tracker } from "@/components/tracker";
import { alternatePath } from "@/lib/locale";

type View = "costs" | "profile" | "search" | "tracker";

const views = [
  { icon: FileUserIcon, key: "profile" },
  { icon: BriefcaseBusinessIcon, key: "tracker" },
  { icon: InformationCircleIcon, key: "costs" },
] as const;

/** Renders the exact Nakafa sidebar composition around the Rantau workspace. */
export function Shell() {
  const t = useTranslations("common");
  const [view, setView] = useState<View>("search");

  return (
    <SidebarProvider>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background lg:hidden">
          <div className="flex w-full items-center gap-3 px-6">
            <SidebarTrigger className="size-9" variant="outline" />
            <p className="truncate font-medium text-sm">{t(view)}</p>
          </div>
        </header>
        <div className="relative">
          <div className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
            {view === "search" ? <Search /> : null}
            {view === "profile" ? <Profile /> : null}
            {view === "tracker" ? <Tracker /> : null}
            {view === "costs" ? <Costs /> : null}
          </div>
        </div>
      </SidebarInset>
      <AppSidebar
        containerClassName="order-first"
        onViewChange={setView}
        view={view}
      />
    </SidebarProvider>
  );
}

type AppSidebarProps = Readonly<{
  containerClassName?: string;
  onViewChange: (view: View) => void;
  view: View;
}>;

/** Renders Rantau navigation with Nakafa's header, groups, and footer. */
function AppSidebar({
  containerClassName,
  onViewChange,
  view,
}: AppSidebarProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const { signOut } = useAuthActions();
  const { setOpenMobile } = useSidebar();

  /** Selects a workspace view and closes the mobile sheet. */
  function choose(next: View) {
    onViewChange(next);
    setOpenMobile(false);
  }

  return (
    <Sidebar className="z-20" containerClassName={containerClassName}>
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => choose("search")} size="lg">
              <div className="grid aspect-square size-8 place-items-center rounded-sm border bg-background">
                <HugeIcons icon={BriefcaseBusinessIcon} />
              </div>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <p className="truncate font-medium">{t("brand")}</p>
                <SidebarMenuDescription>{t("tagline")}</SidebarMenuDescription>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="justify-start text-muted-foreground"
              isActive={view === "search"}
              onClick={() => choose("search")}
              variant="outline"
            >
              <HugeIcons icon={Search02Icon} />
              <span>{t("search")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("workspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {views.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={view === item.key}
                    onClick={() => choose(item.key)}
                    tooltip={t(item.key)}
                  >
                    <HugeIcons icon={item.icon} />
                    <span>{t(item.key)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href={alternatePath(locale)} />}
              tooltip={t("language")}
            >
              <HugeIcons icon={LanguageSquareIcon} />
              <span>{t("language")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} tooltip={t("signOut")}>
              <HugeIcons icon={Logout01Icon} />
              <span>{t("signOut")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
