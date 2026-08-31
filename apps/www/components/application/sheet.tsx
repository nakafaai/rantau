"use client";

import type { Key } from "@heroui/react";
import {
  Button,
  buttonVariants,
  Description,
  Drawer,
  Form,
  Label,
  Link,
  ListBox,
  Select,
  TextArea,
  toast,
} from "@heroui/react";
import {
  ArrowUpRight01Icon,
  Building02Icon,
  MapsLocation01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ApplicationStatus,
  nextApplicationStatuses,
} from "@repo/domain/application";
import { Option, Schema } from "effect";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DeleteApplicationDialog } from "@/components/application/delete";
import { ApplicationStatusBadge } from "@/components/application/status";
import { CountryFlag } from "@/components/country-flag";
import {
  useDeleteApplication,
  useTransitionApplication,
} from "@/hooks/applications";
import {
  type ApplicationRecord,
  applicationLocation,
  applicationMapsUrl,
} from "@/lib/application";

/** Shows one application's source details and next valid transition. */
export function ApplicationSheet({
  record,
}: Readonly<{ record: ApplicationRecord }>) {
  const t = useTranslations("tracker");
  const search = useTranslations("search");
  const common = useTranslations("common");
  const transition = useTransitionApplication();
  const remove = useDeleteApplication(record.opportunity._id);
  const [deletePending, setDeletePending] = useState(false);
  const [updatePending, setUpdatePending] = useState(false);
  const next = nextApplicationStatuses(record.application.status);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(
    next[0] ?? record.application.status
  );
  const statusId = `status-${record.application._id}`;
  const notesId = `notes-${record.application._id}`;
  const { opportunity } = record.opportunity;

  /** Saves one domain-valid status transition and its private notes. */
  async function update(formData: FormData) {
    const parsedStatus = Option.getOrUndefined(
      Schema.decodeUnknownOption(ApplicationStatus)(formData.get("status"))
    );
    if (!parsedStatus) {
      toast.danger(common("error"));
      return;
    }
    setUpdatePending(true);
    const updated = await transition({
      applicationId: record.application._id,
      notes: String(formData.get("notes") ?? ""),
      requestedAt: Date.now(),
      status: parsedStatus,
    }).then(
      () => true,
      () => false
    );
    setUpdatePending(false);
    if (!updated) {
      toast.danger(common("error"));
      return;
    }
    setSelectedStatus(nextApplicationStatuses(parsedStatus)[0] ?? parsedStatus);
    toast.success(t("updated"));
  }

  /** Removes one owned application and reports whether Convex accepted it. */
  async function deleteApplication() {
    setDeletePending(true);
    const deleted = await remove({
      applicationId: record.application._id,
    }).then(
      () => true,
      () => false
    );
    setDeletePending(false);
    if (!deleted) {
      toast.danger(common("error"));
      return false;
    }
    toast.success(t("deleted"));
    return true;
  }

  /** Accepts only domain-valid application statuses from HeroUI Select. */
  function changeStatus(value: Key | null) {
    const decoded = Option.getOrUndefined(
      Schema.decodeUnknownOption(ApplicationStatus)(value)
    );
    if (decoded) {
      setSelectedStatus(decoded);
    }
  }

  const availableStatuses = next.length ? next : [record.application.status];

  return (
    <Drawer>
      <Button
        aria-label={search("actions")}
        className="ml-auto"
        isIconOnly
        size="sm"
        variant="tertiary"
      >
        <HugeiconsIcon
          className="size-4"
          icon={MoreVerticalIcon}
          strokeWidth={2}
        />
      </Button>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="w-full max-w-xl sm:w-[36rem]">
            <Drawer.CloseTrigger />
            <Form action={update} className="flex min-h-0 flex-1 flex-col">
              <Drawer.Header className="pe-8">
                <ApplicationStatusBadge status={record.application.status} />
                <Drawer.Heading>{opportunity.title}</Drawer.Heading>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-muted text-sm">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <HugeiconsIcon
                      aria-hidden="true"
                      className="size-4 shrink-0"
                      icon={Building02Icon}
                      strokeWidth={2}
                    />
                    <span className="truncate">{opportunity.company}</span>
                  </span>
                  <Link
                    href={applicationMapsUrl(record)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <CountryFlag
                      countryCode={opportunity.countryCode}
                      fallback={
                        <HugeiconsIcon
                          aria-hidden="true"
                          className="size-4"
                          icon={MapsLocation01Icon}
                          strokeWidth={2}
                        />
                      }
                    />
                    {applicationLocation(record)}
                    <Link.Icon>
                      <HugeiconsIcon
                        aria-hidden="true"
                        className="size-4"
                        icon={ArrowUpRight01Icon}
                        strokeWidth={2}
                      />
                    </Link.Icon>
                  </Link>
                  <Link
                    href={opportunity.source.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {opportunity.source.name}
                    <Link.Icon>
                      <HugeiconsIcon
                        aria-hidden="true"
                        className="size-4"
                        icon={ArrowUpRight01Icon}
                        strokeWidth={2}
                      />
                    </Link.Icon>
                  </Link>
                </div>
              </Drawer.Header>
              <Drawer.Body className="space-y-6">
                <Select
                  id={statusId}
                  isDisabled={next.length === 0}
                  name="status"
                  onChange={changeStatus}
                  placeholder={t(selectedStatus)}
                  value={selectedStatus}
                  variant="secondary"
                >
                  <Label>{t("next-status")}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Description>{t("status-help")}</Description>
                  <Select.Popover>
                    <ListBox>
                      {availableStatuses.map((statusOption) => (
                        <ListBox.Item
                          id={statusOption}
                          key={statusOption}
                          textValue={t(statusOption)}
                        >
                          {t(statusOption)}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <div className="flex flex-col gap-2">
                  <Label htmlFor={notesId}>{t("notes")}</Label>
                  <TextArea
                    aria-describedby={`${notesId}-help`}
                    defaultValue={record.application.notes}
                    id={notesId}
                    maxLength={2000}
                    name="notes"
                    rows={6}
                    variant="secondary"
                  />
                  <Description id={`${notesId}-help`}>
                    {t("notes-help")}
                  </Description>
                </div>
              </Drawer.Body>
              <Drawer.Footer className="flex-wrap justify-between">
                <DeleteApplicationDialog
                  disabled={deletePending || updatePending}
                  onDelete={deleteApplication}
                />
                <div className="ml-auto flex flex-wrap gap-2">
                  <Link
                    aria-label={search("apply")}
                    className={buttonVariants({ variant: "secondary" })}
                    href={opportunity.directApplyUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {search("apply")}
                    <HugeiconsIcon
                      className="size-4"
                      icon={ArrowUpRight01Icon}
                      strokeWidth={2}
                    />
                  </Link>
                  <Button
                    isDisabled={
                      deletePending || updatePending || next.length === 0
                    }
                    isPending={updatePending}
                    type="submit"
                  >
                    {t("update")}
                  </Button>
                </div>
              </Drawer.Footer>
            </Form>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
