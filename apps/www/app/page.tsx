import { Button } from "@repo/design-system/components/ui/button";
import Link from "next/link";

/** Offers a deterministic locale choice at the static site root. */
export default function Page() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <section className="max-w-lg space-y-6 text-center">
        <p className="font-semibold text-primary text-sm uppercase tracking-[0.2em]">
          Rantau
        </p>
        <h1 className="font-semibold text-4xl tracking-tight sm:text-5xl">
          Cari kerja, tanpa ribet.
        </h1>
        <p className="text-muted-foreground">
          Pilih bahasa untuk mulai mencari kesempatan langsung di seluruh
          dunia.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/id/">Bahasa Indonesia</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/en/">English</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
