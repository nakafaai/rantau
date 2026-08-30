"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!deploymentUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required.");
}

const convex = new ConvexReactClient(deploymentUrl);

type ProvidersProps = Readonly<{ children: ReactNode }>;

/** Connects browser state to the isolated Rantau Convex deployment. */
export function Providers({ children }: ProvidersProps) {
  return (
    <ConvexAuthProvider client={convex}>
      {children}
      <Toaster richColors />
    </ConvexAuthProvider>
  );
}
