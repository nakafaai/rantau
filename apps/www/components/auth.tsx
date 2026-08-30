"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { ArrowRight01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/design-system/components/ui/field";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Input } from "@repo/design-system/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { Effect, Schema } from "effect";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BackButton } from "@/components/back";
import { FeaturesDithering } from "@/components/dithering";
import { Theme } from "@/components/theme";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Email = Schema.Trim.pipe(Schema.check(Schema.isPattern(EMAIL_PATTERN)));
const Password = Schema.String.check(Schema.isMinLength(12));
const Name = Schema.Trim.pipe(Schema.check(Schema.isMinLength(1)));

const AuthForm = Schema.Union([
  Schema.Struct({
    email: Email,
    flow: Schema.Literal("signIn"),
    name: Schema.String,
    password: Password,
  }),
  Schema.Struct({
    email: Email,
    flow: Schema.Literal("signUp"),
    name: Name,
    password: Password,
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

/** Renders Nakafa's exact auth composition with Convex email/password access. */
export function Auth() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const { signIn } = useAuthActions();
  const form = useForm({
    defaultValues,
    validators: {
      onChange: formSchema,
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      await Effect.runPromise(
        Effect.tryPromise(async () => {
          const formData = new FormData();
          formData.set("email", value.email);
          formData.set("flow", value.flow);
          formData.set("password", value.password);
          if (value.flow === "signUp") {
            formData.set("name", value.name);
          }
          await signIn("password", formData);
        }).pipe(
          Effect.catchTag("UnknownError", () =>
            Effect.sync(() => {
              toast.error(common("error"));
            })
          )
        )
      );
    },
  });

  return (
    <main className="relative grid h-svh lg:grid-cols-7">
      <div className="col-span-3 flex flex-col gap-4 p-6 sm:p-12">
        <div className="flex items-center justify-between">
          <BackButton />
          <Theme />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center">
            <h1 className="font-semibold text-2xl">{common("brand")}</h1>
            <p className="text-muted-foreground">{common("tagline")}</p>
          </div>

          <div className="w-full max-w-sm">
            <form
              action={() => form.handleSubmit()}
              className="flex flex-col gap-4"
            >
              <FieldGroup>
                <form.Subscribe selector={(state) => state.values.flow}>
                  {(flow) =>
                    flow === "signUp" ? (
                      <form.Field name="name">
                        {(field) => {
                          const isInvalid =
                            Boolean(field.state.meta.isTouched) &&
                            Boolean(!field.state.meta.isValid);
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                {t("name")}
                              </FieldLabel>
                              <Input
                                aria-invalid={isInvalid}
                                autoComplete="name"
                                id={field.name}
                                name={field.name}
                                onBlur={field.handleBlur}
                                onChange={(event) =>
                                  field.handleChange(event.target.value)
                                }
                                required
                                value={field.state.value}
                              />
                              {isInvalid ? (
                                <FieldError>{t("nameInvalid")}</FieldError>
                              ) : null}
                            </Field>
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
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          {t("email")}
                        </FieldLabel>
                        <Input
                          aria-invalid={isInvalid}
                          autoComplete="email"
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          required
                          type="email"
                          value={field.state.value}
                        />
                        {isInvalid ? (
                          <FieldError>{t("emailInvalid")}</FieldError>
                        ) : null}
                      </Field>
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
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>
                              {t("password")}
                            </FieldLabel>
                            <Input
                              aria-invalid={isInvalid}
                              autoComplete={
                                flow === "signUp"
                                  ? "new-password"
                                  : "current-password"
                              }
                              id={field.name}
                              minLength={12}
                              name={field.name}
                              onBlur={field.handleBlur}
                              onChange={(event) =>
                                field.handleChange(event.target.value)
                              }
                              required
                              type="password"
                              value={field.state.value}
                            />
                            {isInvalid ? (
                              <FieldError>{t("passwordRule")}</FieldError>
                            ) : null}
                            {!isInvalid && flow === "signUp" ? (
                              <FieldDescription>
                                {t("passwordRule")}
                              </FieldDescription>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                  )}
                </form.Subscribe>
              </FieldGroup>

              <form.Subscribe
                selector={(state) => [state.isValid, state.isSubmitting]}
              >
                {([isValid, isSubmitting]) => (
                  <Button
                    className="w-full"
                    disabled={!isValid || isSubmitting}
                    type="submit"
                  >
                    <form.Subscribe selector={(state) => state.values.flow}>
                      {(flow) =>
                        flow === "signUp" ? t("signUp") : t("signIn")
                      }
                    </form.Subscribe>
                    <HugeIcons
                      className={isSubmitting ? "animate-spin" : undefined}
                      icon={isSubmitting ? Loading03Icon : ArrowRight01Icon}
                    />
                  </Button>
                )}
              </form.Subscribe>
            </form>

            <form.Subscribe selector={(state) => state.values.flow}>
              {(flow) => (
                <Button
                  className="mt-4 h-auto w-full p-0 text-muted-foreground"
                  onClick={() =>
                    form.setFieldValue(
                      "flow",
                      flow === "signUp" ? "signIn" : "signUp"
                    )
                  }
                  variant="link"
                >
                  {flow === "signUp" ? t("existing") : t("new")}{" "}
                  {flow === "signUp" ? t("signIn") : t("signUp")}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </div>

      <div className="relative col-span-4 hidden lg:block">
        <FeaturesDithering />
      </div>
    </main>
  );
}
