"use client";

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";
import { Add01Icon, MinusSignIcon } from "@hugeicons/core-free-icons";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { cn } from "@repo/design-system/lib/utils";
import type { ReactElement } from "react";

/** Renders the Coss number-field root with shared sizing. */
function NumberField({
  className,
  size = "default",
  ...props
}: NumberFieldPrimitive.Root.Props & {
  size?: "default" | "sm";
}): ReactElement {
  return (
    <NumberFieldPrimitive.Root
      className={cn("flex w-full flex-col items-start gap-2", className)}
      data-size={size}
      data-slot="number-field"
      {...props}
    />
  );
}

/** Groups the number input and its stepper controls. */
function NumberFieldGroup({
  className,
  ...props
}: NumberFieldPrimitive.Group.Props): ReactElement {
  return (
    <NumberFieldPrimitive.Group
      className={cn(
        "relative flex w-full justify-between rounded-md border border-input bg-background text-foreground text-sm shadow-xs outline-none transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 dark:bg-input/30 dark:has-aria-invalid:ring-destructive/40",
        className
      )}
      data-slot="number-field-group"
      {...props}
    />
  );
}

/** Decrements the current number-field value. */
function NumberFieldDecrement({
  className,
  ...props
}: NumberFieldPrimitive.Decrement.Props): ReactElement {
  return (
    <NumberFieldPrimitive.Decrement
      className={cn(
        "relative flex shrink-0 cursor-pointer items-center justify-center rounded-s-[calc(var(--radius-md)-1px)] px-3 transition-colors hover:bg-accent",
        className
      )}
      data-slot="number-field-decrement"
      {...props}
    >
      <HugeIcons className="size-4" icon={MinusSignIcon} />
    </NumberFieldPrimitive.Decrement>
  );
}

/** Increments the current number-field value. */
function NumberFieldIncrement({
  className,
  ...props
}: NumberFieldPrimitive.Increment.Props): ReactElement {
  return (
    <NumberFieldPrimitive.Increment
      className={cn(
        "relative flex shrink-0 cursor-pointer items-center justify-center rounded-e-[calc(var(--radius-md)-1px)] px-3 transition-colors hover:bg-accent",
        className
      )}
      data-slot="number-field-increment"
      {...props}
    >
      <HugeIcons className="size-4" icon={Add01Icon} />
    </NumberFieldPrimitive.Increment>
  );
}

/** Renders the centered numeric input owned by a number field. */
function NumberFieldInput({
  className,
  ...props
}: NumberFieldPrimitive.Input.Props): ReactElement {
  return (
    <NumberFieldPrimitive.Input
      className={cn(
        "h-9 in-data-[size=sm]:h-8 w-full min-w-0 grow bg-transparent px-3 text-center text-foreground tabular-nums outline-none",
        className
      )}
      data-slot="number-field-input"
      {...props}
    />
  );
}

export {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
};
