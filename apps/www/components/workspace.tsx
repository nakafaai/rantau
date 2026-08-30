"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useTranslations } from "next-intl";
import { Auth } from "@/components/auth";
import { Shell } from "@/components/shell";

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
