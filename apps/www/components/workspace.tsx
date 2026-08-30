"use client";

import { Auth } from "@/components/auth";
import { Shell } from "@/components/shell";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useTranslations } from "next-intl";

/** Chooses the authenticated workspace after the Convex Auth handshake. */
export function Workspace() {
  const t = useTranslations("common");

  return (
    <>
      <AuthLoading>
        <main className="grid min-h-dvh place-items-center text-muted-foreground text-sm">
          {t("loading")}
        </main>
      </AuthLoading>
      <Unauthenticated>
        <Auth />
      </Unauthenticated>
      <Authenticated>
        <Shell />
      </Authenticated>
    </>
  );
}
