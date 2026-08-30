import { Providers } from "@/components/providers";
import { Search } from "@/components/search";
import { Workspace } from "@/components/workspace";
import id from "@/messages/id.json";

/** Opens Rantau directly in the default Indonesian workspace. */
export default function Page() {
  return (
    <Providers locale="id" messages={id}>
      <Workspace>
        <Search />
      </Workspace>
    </Providers>
  );
}
