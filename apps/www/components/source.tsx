"use client";

import { buttonVariants, cn, Link, Tooltip } from "@heroui/react";
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
      <Tooltip delay={150}>{children}</Tooltip>
    </SourceContext.Provider>
  );
}

type SourceTriggerProps = Readonly<{
  className?: string;
  label?: React.ReactNode;
}>;

/** Renders the source as a native HeroUI tertiary action. */
export function SourceTrigger({ className, label }: SourceTriggerProps) {
  const { domain, href } = useSource();
  const [failed, setFailed] = useState(false);
  const icon = faviconUrl(href);

  return (
    <Link
      className={cn(
        buttonVariants({ size: "sm", variant: "tertiary" }),
        "h-7 max-w-56 gap-1.5 overflow-hidden px-2 text-muted text-xs no-underline hover:no-underline",
        className
      )}
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
    </Link>
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
    <Tooltip.Content className="w-80 max-w-[min(20rem,calc(100vw-2rem))] p-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-link text-sm">
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
          <p className="line-clamp-2 text-muted text-sm">{description}</p>
        ) : null}
        {kind ? <p className="text-muted text-xs capitalize">{kind}</p> : null}
      </div>
    </Tooltip.Content>
  );
}
