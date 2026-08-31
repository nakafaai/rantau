"use client";

import { Button, Card } from "@heroui/react";
import { SaveIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { profileFormOptions, withProfileForm } from "@/lib/profile-form";

/** Renders one consistent save footer driven by TanStack Form state. */
export const SettingsFooter = withProfileForm({
  ...profileFormOptions,
  props: { disabled: false, helper: "", label: "" },
  render: ({ disabled, form, helper, label }) => (
    <Card.Footer className="flex-wrap justify-between gap-4">
      <p className="text-muted text-sm">{helper}</p>
      <form.Subscribe
        selector={(state) => [
          state.canSubmit,
          state.isDefaultValue,
          state.isSubmitting,
        ]}
      >
        {([canSubmit, isDefaultValue, isSubmitting]) => (
          <Button
            isDisabled={
              disabled || !canSubmit || isDefaultValue || isSubmitting
            }
            isPending={isSubmitting}
            size="sm"
            type="submit"
          >
            <HugeiconsIcon className="size-4" icon={SaveIcon} strokeWidth={2} />
            {label}
          </Button>
        )}
      </form.Subscribe>
    </Card.Footer>
  ),
});
