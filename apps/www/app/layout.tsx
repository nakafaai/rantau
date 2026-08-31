import "@repo/design-system/styles/globals.css";
import { fonts } from "@repo/design-system/lib/fonts";
import { ThemeProvider } from "@repo/design-system/providers/theme";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  description:
    "Direct global job and vocational opportunity search with clear application readiness.",
  title: "Rantau",
};

type LayoutProps = Readonly<{ children: ReactNode }>;

/** Provides the document boundary shared by every statically exported locale. */
export default function Layout({ children }: LayoutProps) {
  return (
    <html className={fonts} lang="id" suppressHydrationWarning>
      <body className="min-h-dvh">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
