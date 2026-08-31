"use client";

import { useAuthActions, useAuthSignInApi } from "@convex-dev/auth/react";
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { api } from "@repo/backend/convex/_generated/api";
import {
  IdentityPassword,
  MAXIMUM_PASSWORD_LENGTH,
  MINIMUM_PASSWORD_LENGTH,
} from "@repo/domain/identity";
import { useForm } from "@tanstack/react-form";
import { Effect, Schema } from "effect";
import { useTranslations } from "next-intl";
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
            toast.danger(t(authResultKey(migration.error)));
            return;
          }

          const result = await signInApi.mutation(api.auth.signInWithPassword, {
            email,
            password: value.newPassword,
          });
          if (!result.success) {
            toast.danger(t(authResultKey(result.error)));
            return;
          }

          await setSession(result.tokens);
          form.reset();
          onOpenChange(false);
        }).pipe(
          Effect.catchTag("UnknownError", (error) =>
            Effect.sync(() => {
              const errorKey = authErrorKey(error);
              toast.danger(
                errorKey === "error" ? common("error") : t(errorKey)
              );
            })
          )
        )
      );
    },
  });

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{t("upgradeTitle")}</Modal.Heading>
            <p className="text-muted text-sm">{t("upgradeDescription")}</p>
          </Modal.Header>
          <Modal.Body>
            <Form
              className="flex flex-col gap-4"
              id="password-upgrade"
              onSubmit={(event) => {
                event.preventDefault();
                form.handleSubmit();
              }}
            >
              <form.Field name="newPassword">
                {(field) => {
                  const isInvalid =
                    Boolean(field.state.meta.isTouched) &&
                    Boolean(!field.state.meta.isValid);
                  return (
                    <TextField
                      isInvalid={isInvalid}
                      isRequired
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      type="password"
                      value={field.state.value}
                    >
                      <Label>{t("newPassword")}</Label>
                      <Input
                        autoComplete="new-password"
                        id={field.name}
                        maxLength={MAXIMUM_PASSWORD_LENGTH}
                        minLength={MINIMUM_PASSWORD_LENGTH}
                        type="password"
                        variant="secondary"
                      />
                      {isInvalid ? (
                        <FieldError>{t("passwordRule")}</FieldError>
                      ) : (
                        <Description>{t("passwordRule")}</Description>
                      )}
                    </TextField>
                  );
                }}
              </form.Field>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="secondary">
              {common("cancel")}
            </Button>
            <form.Subscribe
              selector={(state) => [state.isValid, state.isSubmitting]}
            >
              {([isValid, isSubmitting]) => (
                <Button
                  form="password-upgrade"
                  isDisabled={!isValid || isSubmitting}
                  isPending={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? (
                    <Spinner color="current" size="sm" />
                  ) : (
                    <HugeiconsIcon
                      className="size-4"
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                    />
                  )}
                  {t("upgrade")}
                </Button>
              )}
            </form.Subscribe>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
