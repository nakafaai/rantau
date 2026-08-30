"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

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
      <ConvexAuthProvider client={convex}>
        {children}
        <Toaster />
      </ConvexAuthProvider>
    </NextIntlClientProvider>
  );
}
