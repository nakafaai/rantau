"use client";

import {
  ArrowUpRight01Icon,
  Building02Icon,
  MapsLocation01Icon,
  MoreVerticalIcon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/design-system/components/ui/sheet";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import {
  ApplicationStatus,
  nextApplicationStatuses,
} from "@repo/domain/application";
import { Option, Schema } from "effect";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteApplicationDialog } from "@/components/application-delete";
import { ApplicationStatusBadge } from "@/components/application-status";
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
      toast.error(common("error"));
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
      toast.error(common("error"));
      return;
    }
    setSelectedStatus(nextApplicationStatuses(parsedStatus)[0] ?? parsedStatus);
    toast.success(t("updated"));
  }

  /** Removes one owned application and lets Convex reconcile the realtime list. */
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
      toast.error(common("error"));
      return;
    }
    toast.success(t("deleted"));
  }

  /** Accepts only domain-valid application statuses from the radio menu. */
  function changeStatus(value: string) {
    const decoded = Option.getOrUndefined(
      Schema.decodeUnknownOption(ApplicationStatus)(value)
    );
    if (decoded) {
      setSelectedStatus(decoded);
    }
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            aria-label={search("actions")}
            className="ml-auto"
            size="icon-sm"
            variant="ghost"
          />
        }
      >
        <HugeIcons className="size-4" icon={MoreVerticalIcon} />
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader className="border-b pr-12">
          <ApplicationStatusBadge status={record.application.status} />
          <SheetTitle>{opportunity.title}</SheetTitle>
          <SheetDescription className="flex min-w-0 items-center gap-1.5">
            <CountryFlag countryCode={opportunity.countryCode} />
            <span className="truncate">
              {opportunity.company} · {applicationLocation(record)}
            </span>
          </SheetDescription>
        </SheetHeader>
        <form action={update} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="min-w-0"
                nativeButton={false}
                render={
                  <a
                    aria-label={opportunity.company}
                    href={opportunity.source.url}
                    rel="noreferrer"
                    target="_blank"
                  />
                }
                variant="outline"
              >
                <HugeIcons className="size-4" icon={Building02Icon} />
                <span className="truncate">{opportunity.company}</span>
                <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
              </Button>
              <Button
                className="min-w-0"
                nativeButton={false}
                render={
                  <a
                    aria-label={applicationLocation(record)}
                    href={applicationMapsUrl(record)}
                    rel="noreferrer"
                    target="_blank"
                  />
                }
                variant="outline"
              >
                <HugeIcons className="size-4" icon={MapsLocation01Icon} />
                <span className="truncate">{applicationLocation(record)}</span>
                <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
              </Button>
            </div>
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor={statusId}>
                {t("nextStatus")}
              </label>
              <p className="text-muted-foreground text-sm">{t("statusHelp")}</p>
              <input name="status" type="hidden" value={selectedStatus} />
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={next.length === 0}
                  render={
                    <Button
                      className="w-full justify-between"
                      id={statusId}
                      type="button"
                      variant="outline"
                    />
                  }
                >
                  {t(selectedStatus)}
                  <HugeIcons className="size-4" icon={UnfoldMoreIcon} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuRadioGroup
                    onValueChange={changeStatus}
                    value={selectedStatus}
                  >
                    {(next.length ? next : [record.application.status]).map(
                      (statusOption) => (
                        <DropdownMenuRadioItem
                          key={statusOption}
                          value={statusOption}
                        >
                          {t(statusOption)}
                        </DropdownMenuRadioItem>
                      )
                    )}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor={notesId}>
                {t("notes")}
              </label>
              <p className="text-muted-foreground text-sm">{t("notesHelp")}</p>
              <Textarea
                defaultValue={record.application.notes}
                id={notesId}
                maxLength={2000}
                name="notes"
              />
            </div>
          </div>
          <SheetFooter className="border-t bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
            <DeleteApplicationDialog
              disabled={deletePending || updatePending}
              onDelete={deleteApplication}
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                nativeButton={false}
                render={
                  <a
                    aria-label={search("apply")}
                    href={opportunity.directApplyUrl}
                    rel="noreferrer"
                    target="_blank"
                  />
                }
                variant="outline"
              >
                {search("apply")}
                <HugeIcons className="size-4" icon={ArrowUpRight01Icon} />
              </Button>
              <Button
                disabled={deletePending || updatePending || next.length === 0}
                type="submit"
              >
                {t("update")}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
