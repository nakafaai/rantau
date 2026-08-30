import { Providers } from "@/components/providers";
import { isLocale, locales } from "@/i18n/routing";
import en from "@/messages/en.json";
import id from "@/messages/id.json";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

type LayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>;

/** Prebuilds both supported language shells for Convex static hosting. */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Validates the locale and installs translation and Convex providers. */
export default async function Layout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const messages = locale === "id" ? id : en;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
