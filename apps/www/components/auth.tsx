"use client";

import { useAuthActions, useAuthSignInApi } from "@convex-dev/auth/react";
import {
  Button,
  Card,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { api } from "@repo/backend/convex/_generated/api";
import {
  IdentityEmail,
  IdentityName,
  IdentityPassword,
  MAXIMUM_EMAIL_LENGTH,
  MAXIMUM_NAME_LENGTH,
  MAXIMUM_PASSWORD_LENGTH,
  MINIMUM_PASSWORD_LENGTH,
} from "@repo/domain/identity";
import { useForm } from "@tanstack/react-form";
import { Effect, Schema } from "effect";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FeaturesDithering } from "@/components/dithering";
import { AuthPreferences } from "@/components/preferences";
import { Rekey } from "@/components/rekey";
import { authErrorKey, authResultKey } from "@/lib/auth";

const RequiredName = IdentityName.pipe(Schema.check(Schema.isMinLength(1)));

const AuthForm = Schema.Union([
  Schema.Struct({
    email: IdentityEmail,
    flow: Schema.Literal("signIn"),
    name: Schema.String,
    password: IdentityPassword,
  }),
  Schema.Struct({
    email: IdentityEmail,
    flow: Schema.Literal("signUp"),
    name: RequiredName,
    password: IdentityPassword,
  }),
]);
const formSchema = Schema.toStandardSchemaV1(AuthForm);
type AuthFormValues = Schema.Schema.Type<typeof AuthForm>;
const defaultValues: AuthFormValues = {
  email: "",
  flow: "signIn",
  name: "",
  password: "",
};

/** Renders Rantau's native HeroUI auth composition with Convex access. */
export function Auth() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const { setSession } = useAuthActions();
  const signInApi = useAuthSignInApi();
  const [legacy, setLegacy] = useState<{
    email: string;
    password: string;
  } | null>(null);

  /** Transparently upgrades a verified v1 password before the v2 sign-in. */
  async function signInWithMigration(email: string, password: string) {
    let result = await signInApi.mutation(api.auth.signInWithPassword, {
      email,
      password,
    });
    if (!result.success && result.error === "USER_NOT_FOUND") {
      const migration = await signInApi.action(api.auth.migratePassword, {
        email,
        password,
      });
      if (!migration.success) {
        if (migration.error === "PASSWORD_TOO_COMMON") {
          setLegacy({ email, password });
          return null;
        }
        return migration;
      }
      result = await signInApi.mutation(api.auth.signInWithPassword, {
        email,
        password,
      });
    }
    return result;
  }
  const form = useForm({
    defaultValues,
    validators: {
      onChange: formSchema,
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await Effect.runPromise(
        Effect.tryPromise(async () => {
          const result =
            value.flow === "signUp"
              ? await signInApi.mutation(api.auth.signUpWithPassword, {
                  email: value.email,
                  name: value.name,
                  password: value.password,
                })
              : await signInWithMigration(value.email, value.password);
          if (!result) {
            return;
          }
          if (!result.success) {
            toast.danger(t(authResultKey(result.error)));
            return;
          }
          await setSession(result.tokens);
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
    <>
      <main className="relative grid h-svh lg:grid-cols-7">
        <div className="col-span-3 flex flex-col gap-4 p-6 sm:p-12">
          <div className="flex justify-end">
            <AuthPreferences />
          </div>

          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-sm">
              <Card.Header className="items-center text-center">
                <Card.Title className="text-2xl">{common("brand")}</Card.Title>
                <Card.Description>{common("tagline")}</Card.Description>
              </Card.Header>
              <Card.Content>
                <Form
                  className="flex flex-col gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    form.handleSubmit();
                  }}
                >
                  <div className="flex flex-col gap-4">
                    <form.Subscribe selector={(state) => state.values.flow}>
                      {(flow) =>
                        flow === "signUp" ? (
                          <form.Field name="name">
                            {(field) => {
                              const isInvalid =
                                Boolean(field.state.meta.isTouched) &&
                                Boolean(!field.state.meta.isValid);
                              const errorId = `${field.name}-error`;
                              return (
                                <TextField
                                  isInvalid={isInvalid}
                                  isRequired
                                  name={field.name}
                                  onBlur={field.handleBlur}
                                  onChange={field.handleChange}
                                  value={field.state.value}
                                >
                                  <Label>{t("name")}</Label>
                                  <Input
                                    autoComplete="name"
                                    id={field.name}
                                    maxLength={MAXIMUM_NAME_LENGTH}
                                    variant="secondary"
                                  />
                                  {isInvalid ? (
                                    <FieldError id={errorId}>
                                      {t("nameInvalid")}
                                    </FieldError>
                                  ) : null}
                                </TextField>
                              );
                            }}
                          </form.Field>
                        ) : null
                      }
                    </form.Subscribe>

                    <form.Field name="email">
                      {(field) => {
                        const isInvalid =
                          Boolean(field.state.meta.isTouched) &&
                          Boolean(!field.state.meta.isValid);
                        const errorId = `${field.name}-error`;
                        return (
                          <TextField
                            isInvalid={isInvalid}
                            isRequired
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={field.handleChange}
                            type="email"
                            value={field.state.value}
                          >
                            <Label>{t("email")}</Label>
                            <Input
                              autoComplete="email"
                              id={field.name}
                              maxLength={MAXIMUM_EMAIL_LENGTH}
                              type="email"
                              variant="secondary"
                            />
                            {isInvalid ? (
                              <FieldError id={errorId}>
                                {t("emailInvalid")}
                              </FieldError>
                            ) : null}
                          </TextField>
                        );
                      }}
                    </form.Field>

                    <form.Subscribe selector={(state) => state.values.flow}>
                      {(flow) => (
                        <form.Field name="password">
                          {(field) => {
                            const isInvalid =
                              Boolean(field.state.meta.isTouched) &&
                              Boolean(!field.state.meta.isValid);
                            const errorId = `${field.name}-error`;
                            const helpId = `${field.name}-help`;
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
                                <Label>{t("password")}</Label>
                                <Input
                                  autoComplete={
                                    flow === "signUp"
                                      ? "new-password"
                                      : "current-password"
                                  }
                                  id={field.name}
                                  maxLength={MAXIMUM_PASSWORD_LENGTH}
                                  minLength={MINIMUM_PASSWORD_LENGTH}
                                  type="password"
                                  variant="secondary"
                                />
                                {isInvalid ? (
                                  <FieldError id={errorId}>
                                    {t("passwordRule")}
                                  </FieldError>
                                ) : null}
                                {!isInvalid && flow === "signUp" ? (
                                  <Description id={helpId}>
                                    {t("passwordRule")}
                                  </Description>
                                ) : null}
                              </TextField>
                            );
                          }}
                        </form.Field>
                      )}
                    </form.Subscribe>
                  </div>

                  <form.Subscribe
                    selector={(state) => [state.isValid, state.isSubmitting]}
                  >
                    {([isValid, isSubmitting]) => (
                      <Button
                        className="w-full"
                        isDisabled={!isValid || isSubmitting}
                        isPending={isSubmitting}
                        type="submit"
                      >
                        <form.Subscribe selector={(state) => state.values.flow}>
                          {(flow) =>
                            flow === "signUp" ? t("signUp") : t("signIn")
                          }
                        </form.Subscribe>
                        {isSubmitting ? (
                          <Spinner color="current" size="sm" />
                        ) : (
                          <HugeiconsIcon
                            className="size-4"
                            icon={ArrowRight01Icon}
                            strokeWidth={2}
                          />
                        )}
                      </Button>
                    )}
                  </form.Subscribe>
                </Form>
              </Card.Content>
              <Card.Footer>
                <form.Subscribe selector={(state) => state.values.flow}>
                  {(flow) => (
                    <Button
                      className="h-auto w-full text-muted"
                      onPress={() =>
                        form.setFieldValue(
                          "flow",
                          flow === "signUp" ? "signIn" : "signUp"
                        )
                      }
                      variant="tertiary"
                    >
                      {flow === "signUp" ? t("existing") : t("new")}{" "}
                      {flow === "signUp" ? t("signIn") : t("signUp")}
                    </Button>
                  )}
                </form.Subscribe>
              </Card.Footer>
            </Card>
          </div>
        </div>

        <div className="relative col-span-4 hidden lg:block">
          <FeaturesDithering />
        </div>
      </main>
      {legacy ? (
        <Rekey
          email={legacy.email}
          onOpenChange={(open) => {
            if (!open) {
              setLegacy(null);
            }
          }}
          open
          password={legacy.password}
        />
      ) : null}
    </>
  );
}
