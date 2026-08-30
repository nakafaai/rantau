"use client";

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@repo/design-system/components/ui/button";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { cn } from "@repo/design-system/lib/utils";
import type * as React from "react";

/** Renders the Sheet design-system primitive. */
function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

/** Renders the SheetTrigger design-system primitive. */
function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

/** Renders the SheetClose design-system primitive. */
function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

/** Renders the SheetPortal design-system primitive. */
function SheetPortal(props: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

/** Renders the animated Sheet overlay. */
function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs motion-reduce:transition-none",
        className
      )}
      data-slot="sheet-overlay"
      {...props}
    />
  );
}

/** Renders the animated SheetContent design-system primitive. */
function SheetContent({
  className,
  children,
  showCloseButton = true,
  side = "right",
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "bottom" | "left" | "right" | "top";
  showCloseButton?: boolean;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-popover-foreground text-sm shadow-lg transition duration-200 ease-in-out data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=bottom]:inset-x-0 data-[side=top]:inset-x-0 data-[side=left]:inset-y-0 data-[side=right]:inset-y-0 data-[side=top]:top-0 data-[side=right]:right-0 data-[side=bottom]:bottom-0 data-[side=left]:left-0 data-[side=bottom]:h-auto data-[side=left]:h-full data-[side=right]:h-full data-[side=top]:h-auto data-[side=left]:w-3/4 data-[side=right]:w-3/4 data-[side=bottom]:border-t data-[side=left]:border-r data-[side=top]:border-b data-[side=right]:border-l data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
          className
        )}
        data-side={side}
        data-slot="sheet-content"
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                className="absolute top-3 right-3"
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            <HugeIcons className="size-4" icon={Cancel01Icon} />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

/** Renders the SheetHeader design-system primitive. */
function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-0.5 p-4", className)}
      data-slot="sheet-header"
      {...props}
    />
  );
}

/** Renders the SheetFooter design-system primitive. */
function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      data-slot="sheet-footer"
      {...props}
    />
  );
}

/** Renders the SheetTitle design-system primitive. */
function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      className={cn("font-medium text-base text-foreground", className)}
      data-slot="sheet-title"
      {...props}
    />
  );
}

/** Renders the SheetDescription design-system primitive. */
function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="sheet-description"
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
