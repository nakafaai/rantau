"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import {
  BriefcaseBusiness,
  CircleHelp,
  FileUser,
  Globe2,
  LogOut,
  Menu,
  SearchIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Costs } from "@/components/costs";
import { Profile } from "@/components/profile";
import { Search } from "@/components/search";
import { Tracker } from "@/components/tracker";

type View = "costs" | "profile" | "search" | "tracker";

const views = [
  { icon: SearchIcon, key: "search" },
  { icon: FileUser, key: "profile" },
  { icon: BriefcaseBusiness, key: "tracker" },
  { icon: CircleHelp, key: "costs" },
] as const;

/** Renders the responsive Nakafa-inspired application shell. */
export function Shell() {
  const t = useTranslations("common");
  const locale = useLocale();
  const { signOut } = useAuthActions();
  const [view, setView] = useState<View>("search");
  const [open, setOpen] = useState(false);

  /** Selects one workspace view and closes the mobile navigation. */
  function choose(next: View) {
    setView(next);
    setOpen(false);
  }

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[17rem_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-sidebar-border border-r bg-sidebar p-4 transition-transform lg:sticky lg:top-0 lg:h-dvh lg:w-auto lg:translate-x-0",
          open && "translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">
              R
            </span>
            <div>
              <p className="font-semibold">{t("brand")}</p>
              <p className="text-muted-foreground text-xs">{t("tagline")}</p>
            </div>
          </div>
          <Button
            aria-label="Close navigation"
            className="lg:hidden"
            onClick={() => setOpen(false)}
            size="icon"
            variant="ghost"
          >
            <X />
          </Button>
        </div>

        <nav aria-label="Workspace" className="mt-6 grid gap-1">
          {views.map(({ icon: Icon, key }) => (
            <button
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-left font-medium text-sm transition-colors",
                view === key
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
              key={key}
              onClick={() => choose(key)}
              type="button"
            >
              <Icon className="size-4" />
              {t(key)}
            </button>
          ))}
        </nav>

        <div className="mt-auto grid gap-1 border-sidebar-border border-t pt-4">
          <Button asChild className="justify-start" variant="ghost">
            <Link href={`/${locale === "id" ? "en" : "id"}/`}>
              <Globe2 /> {t("language")}
            </Link>
          </Button>
          <Button
            className="justify-start"
            onClick={() => signOut()}
            variant="ghost"
          >
            <LogOut /> {t("signOut")}
          </Button>
        </div>
      </aside>

      {open ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          type="button"
        />
      ) : null}

      <main className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-background/90 px-4 backdrop-blur lg:hidden">
          <Button
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
            size="icon"
            variant="outline"
          >
            <Menu />
          </Button>
          <span className="ml-3 font-semibold">{t(view)}</span>
        </header>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:py-12">
          {view === "search" ? <Search /> : null}
          {view === "profile" ? <Profile /> : null}
          {view === "tracker" ? <Tracker /> : null}
          {view === "costs" ? <Costs /> : null}
        </div>
      </main>
    </div>
  );
}
