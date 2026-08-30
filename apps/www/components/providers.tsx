"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { api } from "@repo/backend/convex/_generated/api";
import { ConvexReactClient } from "convex/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const AUTH_STORAGE_NAMESPACE = "rantau-v2";

if (!deploymentUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required.");
}

const convex = new ConvexReactClient(deploymentUrl);

type ProvidersProps = Readonly<{
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}>;

/** Connects browser state to the isolated Rantau Convex deployment. */
export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <ConvexAuthProvider
        ambientSignIns={[]}
        api={{
          refreshSession: api.auth.refreshSession,
          signOut: api.auth.signOut,
        }}
        client={convex}
        storageNamespace={AUTH_STORAGE_NAMESPACE}
      >
        {children}
        <Toaster />
      </ConvexAuthProvider>
    </NextIntlClientProvider>
  );
}
