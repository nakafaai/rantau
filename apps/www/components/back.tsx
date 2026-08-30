"use client";

import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@repo/design-system/components/ui/button";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import Link from "next/link";
import { useTranslations } from "next-intl";

/** Returns from the auth boundary to Rantau's locale chooser. */
export function BackButton() {
  const t = useTranslations("common");

  return (
    <Button nativeButton={false} render={<Link href="/" />} variant="ghost">
      <HugeIcons icon={ArrowLeft02Icon} />
      {t("back")}
    </Button>
  );
}
