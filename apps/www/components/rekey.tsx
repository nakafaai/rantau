"use client";

import { useAuthActions, useAuthSignInApi } from "@convex-dev/auth/react";
import { ArrowRight01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@repo/design-system/components/ui/field";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Input } from "@repo/design-system/components/ui/input";
import {
  IdentityPassword,
  MAXIMUM_PASSWORD_LENGTH,
  MINIMUM_PASSWORD_LENGTH,
} from "@repo/domain/identity";
import { useForm } from "@tanstack/react-form";
import { Effect, Schema } from "effect";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { authErrorKey, authResultKey } from "@/lib/auth";

const PasswordUpgrade = Schema.Struct({ newPassword: IdentityPassword });
const upgradeSchema = Schema.toStandardSchemaV1(PasswordUpgrade);

interface RekeyProps {
  email: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  password: string;
}

/** Replaces a verified legacy password that the v2 policy no longer accepts. */
export function Rekey({ email, onOpenChange, open, password }: RekeyProps) {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const signInApi = useAuthSignInApi();
  const { setSession } = useAuthActions();
  const form = useForm({
    defaultValues: { newPassword: "" },
    validators: { onChange: upgradeSchema, onSubmit: upgradeSchema },
    onSubmit: async ({ value }) => {
      await Effect.runPromise(
        Effect.tryPromise(async () => {
          const migration = await signInApi.action(api.auth.migratePassword, {
            email,
            newPassword: value.newPassword,
            password,
          });
          if (!migration.success) {
            toast.error(t(authResultKey(migration.error)));
            return;
          }

          const result = await signInApi.mutation(api.auth.signInWithPassword, {
            email,
            password: value.newPassword,
          });
          if (!result.success) {
            toast.error(t(authResultKey(result.error)));
            return;
          }

          await setSession(result.tokens);
          form.reset();
          onOpenChange(false);
        }).pipe(
          Effect.catchTag("UnknownError", (error) =>
            Effect.sync(() => {
              const errorKey = authErrorKey(error);
              toast.error(errorKey === "error" ? common("error") : t(errorKey));
            })
          )
        )
      );
    },
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("upgradeTitle")}</DialogTitle>
          <DialogDescription>{t("upgradeDescription")}</DialogDescription>
        </DialogHeader>
        <form
          action={() => form.handleSubmit()}
          className="flex flex-col gap-4"
        >
          <form.Field name="newPassword">
            {(field) => {
              const isInvalid =
                Boolean(field.state.meta.isTouched) &&
                Boolean(!field.state.meta.isValid);
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("newPassword")}
                  </FieldLabel>
                  <Input
                    aria-invalid={isInvalid}
                    autoComplete="new-password"
                    id={field.name}
                    maxLength={MAXIMUM_PASSWORD_LENGTH}
                    minLength={MINIMUM_PASSWORD_LENGTH}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    required
                    type="password"
                    value={field.state.value}
                  />
                  {isInvalid ? (
                    <FieldError>{t("passwordRule")}</FieldError>
                  ) : (
                    <FieldDescription>{t("passwordRule")}</FieldDescription>
                  )}
                </Field>
              );
            }}
          </form.Field>
          <form.Subscribe
            selector={(state) => [state.isValid, state.isSubmitting]}
          >
            {([isValid, isSubmitting]) => (
              <Button disabled={!isValid || isSubmitting} type="submit">
                {t("upgrade")}
                <HugeIcons
                  className={isSubmitting ? "animate-spin" : undefined}
                  icon={isSubmitting ? Loading03Icon : ArrowRight01Icon}
                />
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
