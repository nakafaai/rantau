import { Suspense } from "react";
import { Search } from "@/components/search";

/** Renders the route-owned search workspace. */
export default function Page() {
  return (
    <Suspense>
      <Search />
    </Suspense>
  );
}
