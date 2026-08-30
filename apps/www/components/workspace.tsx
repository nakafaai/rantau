"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Auth } from "@/components/auth";
import { Shell } from "@/components/shell";

type WorkspaceProps = Readonly<{ children: ReactNode }>;

/** Chooses the authenticated route-owned workspace after the auth handshake. */
export function Workspace({ children }: WorkspaceProps) {
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
        <Shell>{children}</Shell>
      </Authenticated>
    </>
  );
}
