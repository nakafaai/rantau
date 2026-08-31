"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Auth } from "@/components/auth";
import { Shell } from "@/components/shell";

/** Chooses the authenticated route-owned workspace after the auth handshake. */
export function Workspace({ children }: Readonly<{ children: ReactNode }>) {
  const t = useTranslations("common");

  return (
    <>
      <AuthLoading>
        <div
          aria-busy="true"
          aria-label={t("loading")}
          className="fixed inset-0 bg-background"
          role="status"
        />
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
