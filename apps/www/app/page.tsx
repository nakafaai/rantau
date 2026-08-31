import { Providers } from "@/components/providers";
import { Workspace } from "@/components/workspace";

/** Opens Rantau directly in the default Indonesian workspace. */
export default function Page() {
  return (
    <Providers locale="id">
      <Workspace />
    </Providers>
  );
}
