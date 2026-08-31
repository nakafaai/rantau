"use client";

import { AlertDialog, Button } from "@heroui/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";

type DeleteApplicationDialogProps = Readonly<{
  disabled: boolean;
  onDelete: () => Promise<boolean>;
}>;

/** Confirms permanent removal without making the destructive action ambiguous. */
export function DeleteApplicationDialog({
  disabled,
  onDelete,
}: DeleteApplicationDialogProps) {
  const t = useTranslations("tracker");

  return (
    <AlertDialog>
      <Button isDisabled={disabled} type="button" variant="danger-soft">
        <HugeiconsIcon className="size-4" icon={Delete02Icon} strokeWidth={2} />
        {t("delete")}
      </Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-[26rem]">
            {({ close }) => (
              <>
                <AlertDialog.CloseTrigger />
                <AlertDialog.Header>
                  <AlertDialog.Icon status="danger" />
                  <AlertDialog.Heading>{t("deleteTitle")}</AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>{t("deleteBody")}</AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button slot="close" type="button" variant="tertiary">
                    {t("cancel")}
                  </Button>
                  <Button
                    isDisabled={disabled}
                    onPress={async () => {
                      if (await onDelete()) {
                        close();
                      }
                    }}
                    type="button"
                    variant="danger"
                  >
                    <HugeiconsIcon
                      className="size-4"
                      icon={Delete02Icon}
                      strokeWidth={2}
                    />
                    {t("delete")}
                  </Button>
                </AlertDialog.Footer>
              </>
            )}
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
