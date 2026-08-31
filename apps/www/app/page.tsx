import { Suspense } from "react";
import { Providers } from "@/components/providers";
import { Search } from "@/components/search";
import { Workspace } from "@/components/workspace";

/** Opens Rantau directly in the default Indonesian workspace. */
export default function Page() {
  return (
    <Providers locale="id">
      <Workspace>
        <Suspense>
          <Search />
        </Suspense>
      </Workspace>
    </Providers>
  );
}
