"use client";

import {
  Avatar,
  Button,
  buttonVariants,
  cn,
  Drawer,
  type Key,
  Label,
  Link,
  ListBox,
  ScrollShadow,
  Surface,
} from "@heroui/react";
import {
  BriefcaseBusinessIcon,
  FileUserIcon,
  Menu01Icon,
  Search02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState } from "react";
import { DesktopAccount, MobileAccount } from "@/components/account";
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

type NavigationProps = Readonly<{
  activeRoute: WorkspaceRoute;
  onNavigate?: () => void;
}>;

/** Renders the compact product identity used by both navigation surfaces. */
function Brand({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  const t = useTranslations("common");
  const locale = useLocale() === "id" ? "id" : "en";

  return (
    <Link
      className={cn(
        buttonVariants({ fullWidth: true, variant: "ghost" }),
        "h-auto justify-start gap-3 p-2 no-underline hover:no-underline"
      )}
      href={workspacePath(locale, "search")}
      onPress={onNavigate}
    >
      <Avatar color="accent" size="sm">
        <Avatar.Fallback>
          <HugeiconsIcon
            className="size-4"
            icon={BriefcaseBusinessIcon}
            strokeWidth={2}
          />
        </Avatar.Fallback>
      </Avatar>
      <span className="grid min-w-0 flex-1 text-left leading-tight">
        <span className="truncate font-semibold text-sm">{t("brand")}</span>
        <span className="truncate text-muted text-xs">{t("tagline")}</span>
      </span>
    </Link>
  );
}

/** Renders the native HeroUI navigation actions for every workspace route. */
function NavigationLinks({ activeRoute, onNavigate }: NavigationProps) {
  const t = useTranslations("common");
  const locale = useLocale() === "id" ? "id" : "en";
  const router = useRouter();

  /** Navigates one known workspace destination without a document reload. */
  function navigate(key: Key) {
    const destination = destinations.find(({ route }) => route === key);
    if (!destination) {
      return;
    }
    router.push(workspacePath(locale, destination.route), { scroll: false });
    onNavigate?.();
  }

  return (
    <ListBox
      aria-label={t("workspace")}
      onSelectionChange={(keys) => {
        if (keys === "all") {
          return;
        }
        const [key] = keys;
        if (key !== undefined) {
          navigate(key);
        }
      }}
      selectedKeys={new Set([activeRoute])}
      selectionMode="single"
    >
      {destinations.map(({ icon, route }) => (
        <ListBox.Item
          className="data-[selected=true]:bg-default"
          id={route}
          key={route}
          textValue={t(route)}
        >
          <HugeiconsIcon className="size-4" icon={icon} strokeWidth={2} />
          <Label>{t(route)}</Label>
        </ListBox.Item>
      ))}
    </ListBox>
  );
}

/** Renders the persistent desktop sidebar with HeroUI surface hierarchy. */
function DesktopNavigation({
  activeRoute,
}: Pick<NavigationProps, "activeRoute">) {
  const t = useTranslations("common");

  return (
    <Surface className="flex h-full min-h-0 flex-col" variant="secondary">
      <div className="p-3">
        <Brand />
      </div>
      <ScrollShadow className="min-h-0 flex-1 p-3">
        <p className="px-3 py-2 font-medium text-muted text-xs">
          {t("workspace")}
        </p>
        <NavigationLinks activeRoute={activeRoute} />
      </ScrollShadow>
      <div className="p-3">
        <DesktopAccount />
      </div>
    </Surface>
  );
}

/** Renders a mobile navigation drawer using HeroUI's native anatomy. */
function MobileNavigation({
  activeRoute,
  onNavigate,
}: Omit<NavigationProps, "tooltips">) {
  const t = useTranslations("common");

  return (
    <>
      <Drawer.CloseTrigger />
      <Drawer.Header className="pe-8">
        <Drawer.Heading className="sr-only">{t("workspace")}</Drawer.Heading>
        <Brand onNavigate={onNavigate} />
      </Drawer.Header>
      <Drawer.Body>
        <p className="px-3 py-2 font-medium text-muted text-xs">
          {t("workspace")}
        </p>
        <NavigationLinks activeRoute={activeRoute} onNavigate={onNavigate} />
      </Drawer.Body>
      <Drawer.Footer>
        <MobileAccount onNavigate={onNavigate ?? (() => undefined)} />
      </Drawer.Footer>
    </>
  );
}

/*
 * Keep the sidebar composition explicit. HeroUI v3 does not expose the Pro
 * template's Sidebar primitive, so the shell composes its public Surface,
 * ListBox, Drawer, ScrollShadow, Avatar, Button, and Surface primitives directly.
 */

/** Renders the responsive HeroUI workspace shell without legacy sidebar state. */
export function Shell({ children }: Readonly<{ children: ReactNode }>) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const route = workspaceRoute(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      <aside className="hidden h-full w-64 shrink-0 border-separator border-r lg:block">
        <DesktopNavigation activeRoute={route} />
      </aside>

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 bg-surface-secondary px-4 lg:hidden">
          <Button
            aria-label={t("workspace")}
            isIconOnly
            onPress={() => setMobileOpen(true)}
            size="sm"
            variant="tertiary"
          >
            <HugeiconsIcon
              className="size-5"
              icon={Menu01Icon}
              strokeWidth={2}
            />
          </Button>
          <p className="truncate font-medium text-sm">{t(route)}</p>
        </header>
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
          {children}
        </div>
      </main>

      <Drawer.Backdrop isOpen={mobileOpen} onOpenChange={setMobileOpen}>
        <Drawer.Content placement="left">
          <Drawer.Dialog className="w-72">
            <MobileNavigation
              activeRoute={route}
              onNavigate={() => setMobileOpen(false)}
            />
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </div>
  );
}
