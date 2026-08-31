"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { useTranslations } from "next-intl";

type DeleteApplicationDialogProps = Readonly<{
  disabled: boolean;
  onDelete: () => Promise<void>;
}>;

/** Confirms permanent removal without making the destructive action ambiguous. */
export function DeleteApplicationDialog({
  disabled,
  onDelete,
}: DeleteApplicationDialogProps) {
  const t = useTranslations("tracker");

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            className="text-destructive hover:text-destructive"
            disabled={disabled}
            type="button"
            variant="ghost"
          />
        }
      >
        <HugeIcons className="size-4" icon={Delete02Icon} />
        {t("delete")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteTitle")}</DialogTitle>
          <DialogDescription>{t("deleteBody")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            {t("cancel")}
          </DialogClose>
          <Button
            disabled={disabled}
            onClick={onDelete}
            type="button"
            variant="destructive"
          >
            <HugeIcons className="size-4" icon={Delete02Icon} />
            {t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
