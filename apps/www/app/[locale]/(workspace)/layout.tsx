import type { ReactNode } from "react";
import { Workspace } from "@/components/workspace";

/** Keeps the authenticated Rantau shell mounted across workspace routes. */
export default function Layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <Workspace>{children}</Workspace>;
}
