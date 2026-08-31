"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import {
  Avatar,
  Button,
  Description,
  Dropdown,
  Header,
  Label,
  Separator,
  Skeleton,
} from "@heroui/react";
import {
  Logout01Icon,
  MoreVerticalIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { api } from "@repo/backend/convex/_generated/api";
import { useQuery } from "convex/react";
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

type AccountMenuProps = Readonly<{
  onNavigate?: () => void;
  placement: "desktop" | "mobile";
}>;

/** Renders the HeroUI identity menu with preferences and sign out. */
function AccountMenu({ onNavigate, placement }: AccountMenuProps) {
  const account = useQuery(api.accounts.current);
  const t = useTranslations("common");
  const locale = useLocale() === "id" ? "id" : "en";
  const { signOut } = useAuthActions();

  if (!account) {
    return (
      <div
        aria-hidden
        className="flex min-h-14 items-center gap-3 rounded-xl p-2"
      >
        <Skeleton className="size-9 rounded-full" />
        <div className="grid min-w-0 flex-1 gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="size-4 rounded-full" />
      </div>
    );
  }

  /** Signs out from the current authenticated Convex session. */
  async function handleSignOut() {
    await signOut();
    onNavigate?.();
  }

  return (
    <Dropdown>
      <Button
        aria-label={account.name}
        className="h-auto justify-start gap-3 p-2"
        fullWidth
        variant="ghost"
      >
        <Avatar size="sm">
          {account.image ? (
            <Avatar.Image alt={account.name} src={account.image} />
          ) : null}
          <Avatar.Fallback>{initials(account.name)}</Avatar.Fallback>
        </Avatar>
        <div className="grid min-w-0 flex-1 text-left leading-tight">
          <span className="truncate font-medium text-sm">{account.name}</span>
          <span className="truncate text-muted text-xs">{account.email}</span>
        </div>
        <HugeiconsIcon
          className="ml-auto size-4"
          icon={MoreVerticalIcon}
          strokeWidth={2}
        />
      </Button>
      <Dropdown.Popover
        placement={placement === "mobile" ? "top start" : "right bottom"}
      >
        <Dropdown.Menu
          className="min-w-64 max-w-[calc(100vw-2rem)]"
          onAction={(key) => {
            if (key === "profile") {
              onNavigate?.();
            }
            if (key === "sign-out") {
              handleSignOut();
            }
          }}
        >
          <Dropdown.Section>
            <Header>{account.name}</Header>
            <Dropdown.Item
              href={workspacePath(locale, "profile")}
              id="profile"
              textValue={t("profile")}
            >
              <HugeiconsIcon
                className="size-4"
                icon={UserIcon}
                strokeWidth={2}
              />
              <div className="flex min-w-0 flex-col">
                <Label>{t("profile")}</Label>
                <Description className="truncate">{account.email}</Description>
              </div>
            </Dropdown.Item>
          </Dropdown.Section>
          <Separator />
          <PreferenceSubmenus
            onNavigate={onNavigate}
            side={placement === "mobile" ? "top" : "right"}
          />
          <Separator />
          <Dropdown.Item
            id="sign-out"
            textValue={t("signOut")}
            variant="danger"
          >
            <HugeiconsIcon
              className="size-4"
              icon={Logout01Icon}
              strokeWidth={2}
            />
            <Label>{t("signOut")}</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

/** Renders the account menu beside persistent desktop navigation. */
export function DesktopAccount() {
  return <AccountMenu placement="desktop" />;
}

/** Renders the account menu inside the dismissible mobile drawer. */
export function MobileAccount({
  onNavigate,
}: Readonly<{ onNavigate: () => void }>) {
  return <AccountMenu onNavigate={onNavigate} placement="mobile" />;
}
