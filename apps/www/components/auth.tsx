"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Input } from "@repo/design-system/components/ui/input";
import { ArrowRight, Globe2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

/** Renders password sign-in and account creation against Convex Auth. */
export function Auth() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const locale = useLocale();
  const { signIn } = useAuthActions();
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);

  /** Submits credentials at the explicit Convex Auth boundary. */
  async function submit(formData: FormData) {
    setPending(true);
    formData.set("flow", creating ? "signUp" : "signIn");
    try {
      await signIn("password", formData);
    } catch {
      toast.error(common("error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.2fr_0.8fr]">
      <section className="relative hidden overflow-hidden bg-foreground p-12 text-background lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,var(--primary),transparent_36%),radial-gradient(circle_at_80%_80%,var(--secondary),transparent_32%)]" />
        <div className="relative flex items-center gap-2 font-semibold text-lg">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
            R
          </span>
          {common("brand")}
        </div>
        <div className="relative max-w-xl space-y-5">
          <p className="font-semibold text-primary text-sm uppercase tracking-[0.18em]">
            {t("eyebrow")}
          </p>
          <h1 className="font-semibold text-5xl leading-[1.05] tracking-tight">
            {t("title")}
          </h1>
          <p className="max-w-lg text-background/70 text-lg leading-relaxed">
            {t("description")}
          </p>
        </div>
      </section>

      <section className="flex min-h-dvh items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md border-0 bg-transparent shadow-none">
          <CardHeader className="px-0">
            <div className="mb-5 flex items-center justify-between lg:hidden">
              <span className="font-semibold text-xl">{common("brand")}</span>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/${locale === "id" ? "en" : "id"}/`}>
                  <Globe2 /> {common("language")}
                </Link>
              </Button>
            </div>
            <CardTitle className="text-3xl">
              {creating ? t("signUp") : t("signIn")}
            </CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <form action={submit} className="space-y-4">
              {creating ? (
                <label className="grid gap-2 font-medium text-sm">
                  {t("name")}
                  <Input autoComplete="name" name="name" required />
                </label>
              ) : null}
              <label className="grid gap-2 font-medium text-sm">
                {t("email")}
                <Input autoComplete="email" name="email" required type="email" />
              </label>
              <label className="grid gap-2 font-medium text-sm">
                {t("password")}
                <Input
                  autoComplete={creating ? "new-password" : "current-password"}
                  minLength={12}
                  name="password"
                  required
                  type="password"
                />
                {creating ? (
                  <span className="font-normal text-muted-foreground text-xs">
                    {t("passwordHelp")}
                  </span>
                ) : null}
              </label>
              <Button className="w-full" disabled={pending} size="lg" type="submit">
                {creating ? t("signUp") : t("signIn")}
                <ArrowRight />
              </Button>
            </form>
            <button
              className="mt-5 w-full text-center text-muted-foreground text-sm hover:text-foreground"
              onClick={() => setCreating((value) => !value)}
              type="button"
            >
              {creating ? t("existing") : t("new")} {" "}
              <span className="font-medium text-primary">
                {creating ? t("signIn") : t("signUp")}
              </span>
            </button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
