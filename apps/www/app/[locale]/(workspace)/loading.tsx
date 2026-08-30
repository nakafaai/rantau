import { Skeleton } from "@repo/design-system/components/ui/skeleton";

/** Preserves page geometry while a prefetched workspace route settles. */
export default function Loading() {
  return (
    <div aria-hidden className="space-y-8">
      <Skeleton className="h-8 w-40" />
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    </div>
  );
}
