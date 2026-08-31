"use client";

import { Button, Card, Input, toast } from "@heroui/react";
import { Upload02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { api } from "@repo/backend/convex/_generated/api";
import type { Doc, Id } from "@repo/backend/convex/_generated/dataModel";
import { useAction, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

type CvProps = Readonly<{
  current: Doc<"profiles"> | null;
  disabled: boolean;
}>;

/** Owns private PDF selection, upload, and CV extraction. */
export function Cv({ current, disabled }: CvProps) {
  const t = useTranslations("profile");
  const common = useTranslations("common");
  const createUpload = useMutation(api.profiles.uploadUrl);
  const extractCv = useAction(api.cv.extract);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);

  /** Uploads and extracts the selected PDF through Convex. */
  async function upload() {
    if (file?.type !== "application/pdf" || file.size > 5 * 1024 * 1024) {
      toast.danger(t("cvInvalid"));
      return;
    }
    setPending(true);
    const uploaded = await createUpload()
      .then(async (uploadUrl) => {
        const response = await fetch(uploadUrl, {
          body: file,
          headers: { "Content-Type": file.type },
          method: "POST",
        });
        if (!response.ok) {
          return false;
        }
        const payload = (await response.json()) as {
          storageId: Id<"_storage">;
        };
        await extractCv({ fileId: payload.storageId, fileName: file.name });
        return true;
      })
      .then(
        (value) => value,
        () => false
      );
    setPending(false);
    if (!uploaded) {
      toast.danger(common("error"));
      return;
    }
    setFile(null);
    toast.success(t("uploaded"));
  }

  return (
    <Card aria-busy={disabled} inert={disabled}>
      <Card.Header>
        <Card.Title>{t("cv")}</Card.Title>
        <Card.Description>{t("cvHelp")}</Card.Description>
      </Card.Header>
      <Card.Content>
        <Input
          accept="application/pdf"
          aria-label={t("chooseCv")}
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          ref={inputRef}
          tabIndex={-1}
          type="file"
        />
        <Button
          className="h-auto w-full justify-between p-4 text-left"
          onPress={() => inputRef.current?.click()}
          type="button"
          variant="secondary"
        >
          <span className="min-w-0">
            <span className="block font-medium text-sm">
              {file?.name ?? current?.cvFileName ?? t("chooseCv")}
            </span>
            <span className="mt-1 block text-muted text-xs">
              {t("cvLimit")}
            </span>
          </span>
          <HugeiconsIcon
            className="size-4 shrink-0"
            icon={Upload02Icon}
            strokeWidth={2}
          />
        </Button>
      </Card.Content>
      <Card.Footer className="flex-wrap justify-between gap-4">
        <p className="text-muted text-sm">{t("cvSaveHelp")}</p>
        <Button
          isDisabled={disabled || pending || !current || !file}
          isPending={pending}
          onPress={upload}
          size="sm"
          type="button"
        >
          <HugeiconsIcon
            className="size-4"
            icon={Upload02Icon}
            strokeWidth={2}
          />
          {t("upload")}
        </Button>
      </Card.Footer>
    </Card>
  );
}
