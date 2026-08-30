import { cn } from "@repo/design-system/lib/utils";
import type { ReactNode } from "react";

type HeaderProps = Readonly<{
  actions?: ReactNode;
  className?: string;
  description?: string;
  title: string;
}>;

/** Renders the compact Nakafa page heading shared by Rantau views. */
export function Header({
  actions,
  className,
  description,
  title,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-2">
        <h1 className="text-pretty font-medium text-3xl leading-tight tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}
