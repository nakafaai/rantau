import { Button } from "@repo/design-system/components/ui/button";
import Link from "next/link";
import { localePath } from "@/lib/locale";

/** Offers a deterministic locale choice at the static site root. */
export default function Page() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <section className="max-w-lg space-y-6 text-center">
        <h1 className="font-semibold text-2xl">Rantau</h1>
        <p className="text-muted-foreground">Pilih bahasa</p>
        <div className="flex justify-center gap-3">
          <Button
            nativeButton={false}
            render={<Link href={localePath("id")} />}
          >
            Bahasa Indonesia
          </Button>
          <Button
            nativeButton={false}
            render={<Link href={localePath("en")} />}
            variant="outline"
          >
            English
          </Button>
        </div>
      </section>
    </main>
  );
}
