"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { I18nProvider, RouterProvider, Toast } from "@heroui/react";
import { api } from "@repo/backend/convex/_generated/api";
import { ConvexReactClient } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, useEffect } from "react";
import type { Locale } from "@/i18n/routing";
import { localeFromPath } from "@/lib/locale";
import en from "@/messages/en.json";
import id from "@/messages/id.json";

const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const AUTH_STORAGE_NAMESPACE = "rantau-v2";

if (!deploymentUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required.");
}

const convex = new ConvexReactClient(deploymentUrl);

type ProvidersProps = Readonly<{
  children: ReactNode;
  locale: Locale;
}>;

/** Connects browser state to the isolated Rantau Convex deployment. */
export function Providers({ children, locale }: ProvidersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeLocale = localeFromPath(pathname) ?? locale;
  const messages = activeLocale === "id" ? id : en;

  useEffect(() => {
    document.documentElement.lang = activeLocale;
  }, [activeLocale]);

  return (
    <NextIntlClientProvider
      locale={activeLocale}
      messages={messages}
      timeZone="UTC"
    >
      <I18nProvider locale={activeLocale}>
        <RouterProvider navigate={(href) => router.push(href)}>
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
            <Toast.Provider
              placement="bottom end"
              width="min(28rem, calc(100vw - 2rem))"
            />
          </ConvexAuthProvider>
        </RouterProvider>
      </I18nProvider>
    </NextIntlClientProvider>
  );
}
