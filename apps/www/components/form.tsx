"use client";

import { Form } from "@heroui/react";
import type { Doc } from "@repo/backend/convex/_generated/dataModel";
import { Cv } from "@/components/cv";
import {
  BackgroundCard,
  DocumentsCard,
  PreferencesCard,
} from "@/components/profile-fields";
import {
  type ProfileFormValues,
  profileFormDefaults,
  profileFormOptions,
  useProfileForm,
} from "@/lib/profile-form";

type ProfileFormProps = Readonly<{
  current: Doc<"profiles"> | null;
  disabled: boolean;
  onSubmit: (values: ProfileFormValues) => Promise<boolean>;
}>;

/** Composes typed TanStack Form state over native HeroUI controls. */
export function ProfileForm({ current, disabled, onSubmit }: ProfileFormProps) {
  const form = useProfileForm({
    ...profileFormOptions,
    defaultValues: profileFormDefaults(current),
    onSubmit: async ({ value }) => {
      const saved = await onSubmit(value);
      if (saved) {
        form.reset(value);
      }
    },
  });

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Form
          action={() => form.handleSubmit()}
          aria-busy={disabled || isSubmitting}
          className="grid items-start gap-4 lg:grid-cols-2"
          inert={disabled || isSubmitting}
        >
          <PreferencesCard disabled={disabled} form={form} />
          <BackgroundCard disabled={disabled} form={form} />
          <div className="grid items-start gap-4">
            <DocumentsCard disabled={disabled} form={form} />
            <Cv current={current} disabled={disabled} />
          </div>
        </Form>
      )}
    </form.Subscribe>
  );
}
