"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@repo/design-system/components/ui/hover-card";
import { cn } from "@repo/design-system/lib/utils";
import Image from "next/image";
import { createContext, use, useState } from "react";

type SourceValue = Readonly<{ domain: string; href: string }>;

const SourceContext = createContext<SourceValue | null>(null);

/** Returns the readable hostname for a source URL. */
function sourceDomain(href: string) {
  return URL.canParse(href) ? new URL(href).hostname : href;
}

/** Returns a stable favicon URL for the source domain. */
function faviconUrl(href: string) {
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(href)}`;
}

/** Reads source data from the nearest Source provider. */
function useSource() {
  const value = use(SourceContext);
  if (!value) {
    throw new Error("Source components require a Source parent.");
  }
  return value;
}

type SourceProps = Readonly<{
  children: React.ReactNode;
  href: string;
}>;

/** Provides one source URL to its compact and expanded views. */
export function Source({ children, href }: SourceProps) {
  const domain = sourceDomain(href);

  return (
    <SourceContext.Provider value={{ domain, href }}>
      <HoverCard>{children}</HoverCard>
    </SourceContext.Provider>
  );
}

type SourceTriggerProps = Readonly<{
  className?: string;
  label?: React.ReactNode;
}>;

/** Renders the compact Nakafa-style source chip. */
export function SourceTrigger({ className, label }: SourceTriggerProps) {
  const { domain, href } = useSource();
  const [failed, setFailed] = useState(false);
  const icon = faviconUrl(href);

  return (
    <HoverCardTrigger
      className={cn(
        "inline-flex h-6 max-w-52 items-center gap-1.5 overflow-hidden rounded-full border bg-muted/50 pr-2 pl-1 text-muted-foreground text-xs no-underline transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
      closeDelay={0}
      delay={150}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {failed ? null : (
        <Image
          alt=""
          className="size-4 rounded-full"
          height={16}
          onError={() => setFailed(true)}
          src={icon}
          unoptimized
          width={16}
        />
      )}
      <span className="truncate">{label ?? domain.replace("www.", "")}</span>
    </HoverCardTrigger>
  );
}

type SourceContentProps = Readonly<{
  description?: string;
  kind?: string;
  title: string;
}>;

/** Renders source publisher and evidence context on hover. */
export function SourceContent({
  description,
  kind,
  title,
}: SourceContentProps) {
  const { domain, href } = useSource();

  return (
    <HoverCardContent className="w-80 p-0 shadow-xs">
      <a
        className="flex flex-col gap-2 p-3"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="flex items-center gap-2 text-primary text-sm">
          <Image
            alt=""
            className="size-4 rounded-full"
            height={16}
            src={faviconUrl(href)}
            unoptimized
            width={16}
          />
          <span className="truncate">{domain.replace("www.", "")}</span>
        </div>
        <p className="line-clamp-2 font-medium text-sm">{title}</p>
        {description ? (
          <p className="line-clamp-2 text-muted-foreground text-sm">
            {description}
          </p>
        ) : null}
        {kind ? (
          <p className="text-muted-foreground text-xs capitalize">{kind}</p>
        ) : null}
      </a>
    </HoverCardContent>
  );
}
