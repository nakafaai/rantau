"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import {
  Logout01Icon,
  MoreVerticalIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import {
  SidebarMenuButton,
  SidebarMenuDescription,
  SidebarMenuItem,
} from "@repo/design-system/components/ui/sidebar-menu";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { useSidebar } from "@repo/design-system/lib/sidebar/context";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { PreferenceSubmenus } from "@/components/preferences";
import { workspacePath } from "@/lib/locale";

const WHITESPACE_PATTERN = /\s+/u;

/** Builds a compact avatar label from an account display name. */
function initials(name: string) {
  return name
    .split(WHITESPACE_PATTERN)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Renders the Nakafa-style identity footer with preferences and sign out. */
export function Account() {
  const account = useQuery(api.accounts.current);
  const t = useTranslations("common");
  const locale = useLocale() === "id" ? "id" : "en";
  const { signOut } = useAuthActions();
  const { isMobile } = useSidebar();

  if (!account) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton aria-hidden disabled size="lg">
          <Skeleton className="size-8 rounded-full" />
          <div className="grid min-w-0 flex-1 gap-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="ml-auto size-4 rounded-full" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  /** Signs out without navigating away from the current clean route. */
  async function handleSignOut() {
    await signOut();
  }

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              size="lg"
            >
              <Avatar>
                <AvatarImage alt={account.name} src={account.image ?? ""} />
                <AvatarFallback className="text-xs">
                  {initials(account.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate">{account.name}</span>
                <SidebarMenuDescription>{account.email}</SidebarMenuDescription>
              </div>
              <HugeIcons className="ml-auto size-4" icon={MoreVerticalIcon} />
            </SidebarMenuButton>
          }
        />
        <DropdownMenuContent
          align="end"
          className="w-(--anchor-width) min-w-56 max-w-[calc(100vw-2rem)] rounded-lg"
          side={isMobile ? "bottom" : "right"}
          sideOffset={4}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar>
                  <AvatarImage alt={account.name} src={account.image ?? ""} />
                  <AvatarFallback>{initials(account.name)}</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 leading-tight">
                  <span className="truncate font-medium">{account.name}</span>
                  <span className="truncate text-muted-foreground text-xs">
                    {account.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer"
              render={<Link href={workspacePath(locale, "profile")} />}
            >
              <HugeIcons className="size-4" icon={UserIcon} />
              {t("profile")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <PreferenceSubmenus side={isMobile ? "top" : "right"} />
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={handleSignOut}
            >
              <HugeIcons className="size-4" icon={Logout01Icon} />
              {t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
