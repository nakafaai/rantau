"use client";

import { Upload02Icon } from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import type { Doc, Id } from "@repo/backend/convex/_generated/dataModel";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Input } from "@repo/design-system/components/ui/input";
import { useAction, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";

type CvProps = Readonly<{ current: Doc<"profiles"> | null }>;

/** Owns private PDF selection, upload, and CV extraction. */
export function Cv({ current }: CvProps) {
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
      toast.error(t("cvInvalid"));
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
      toast.error(common("error"));
      return;
    }
    setFile(null);
    toast.success(t("uploaded"));
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{t("cv")}</CardTitle>
        <CardDescription>{t("cvHelp")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          accept="application/pdf"
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          ref={inputRef}
          tabIndex={-1}
          type="file"
        />
        <Button
          className="h-auto w-full justify-between border-dashed p-4 text-left"
          onClick={() => inputRef.current?.click()}
          type="button"
          variant="outline"
        >
          <span className="min-w-0">
            <span className="block font-medium text-sm">
              {file?.name ?? current?.cvFileName ?? t("chooseCv")}
            </span>
            <span className="mt-1 block text-muted-foreground text-xs">
              {t("cvLimit")}
            </span>
          </span>
          <HugeIcons className="size-4 shrink-0" icon={Upload02Icon} />
        </Button>
      </CardContent>
      <CardFooter className="justify-end border-t bg-muted/20">
        <Button disabled={pending || !current || !file} onClick={upload}>
          <HugeIcons className="size-4" icon={Upload02Icon} />
          {t("upload")}
        </Button>
      </CardFooter>
    </Card>
  );
}
