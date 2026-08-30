"use client";

import {
  ArrowUpRight01Icon,
  Building02Icon,
  MapsLocation01Icon,
  MoreVerticalIcon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@repo/design-system/components/ui/badge";
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
import { CountryFlag } from "@/components/country-flag";
import { useTransitionApplication } from "@/hooks/applications";
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
  const [pending, setPending] = useState(false);
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
    setPending(true);
    const updated = await transition({
      applicationId: record.application._id,
      notes: String(formData.get("notes") ?? ""),
      requestedAt: Date.now(),
      status: parsedStatus,
    }).then(
      () => true,
      () => false
    );
    setPending(false);
    if (!updated) {
      toast.error(common("error"));
      return;
    }
    setSelectedStatus(nextApplicationStatuses(parsedStatus)[0] ?? parsedStatus);
    toast.success(t("updated"));
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
          <Badge className="mb-2 w-fit" variant="secondary">
            {t(record.application.status)}
          </Badge>
          <SheetTitle>{opportunity.title}</SheetTitle>
          <SheetDescription className="flex min-w-0 items-center gap-1.5">
            <CountryFlag countryCode={opportunity.countryCode} />
            <span className="truncate">
              {opportunity.company} · {applicationLocation(record)}
            </span>
          </SheetDescription>
        </SheetHeader>
        <form action={update} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
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
                {t("status")}
              </label>
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
              <Textarea
                defaultValue={record.application.notes}
                id={notesId}
                maxLength={2000}
                name="notes"
              />
            </div>
          </div>
          <SheetFooter className="border-t sm:flex-row sm:justify-end">
            <Button disabled={pending || next.length === 0} type="submit">
              {t("update")}
            </Button>
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
