import type { ReactNode } from "react";
import { Workspace } from "@/components/workspace";

type LayoutProps = Readonly<{ children: ReactNode }>;

/** Keeps the authenticated Nakafa shell mounted across workspace routes. */
export default function Layout({ children }: LayoutProps) {
  return <Workspace>{children}</Workspace>;
}
