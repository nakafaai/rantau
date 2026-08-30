import "@repo/design-system/styles/globals.css";
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
    <html lang="id">
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
