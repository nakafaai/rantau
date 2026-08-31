"use client";

import {
  Button,
  Label,
  ListBox,
  Pagination,
  Select,
  Spinner,
} from "@heroui/react";
import { Bookmark01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

const pageSizes = [10, 25, 50] as const;

type ResultsFooterProps = Readonly<{
  canNext: boolean;
  canPrevious: boolean;
  failed: boolean;
  loading: boolean;
  onNext: () => void;
  onPageSizeChange: (size: number) => void;
  onPrevious: () => void;
  onSaveSelected: () => Promise<void>;
  pageCount: number;
  pageEnd: number;
  pageIndex: number;
  pageSize: number;
  pageStart: number;
  running: boolean;
  selectedCount: number;
  total: number;
  visibleRows: number;
}>;

/** Renders HeroUI's native table summary, page-size picker, and pagination. */
export function ResultsFooter({
  canNext,
  canPrevious,
  failed,
  loading,
  onNext,
  onPageSizeChange,
  onPrevious,
  onSaveSelected,
  pageCount,
  pageEnd,
  pageIndex,
  pageSize,
  pageStart,
  running,
  selectedCount,
  total,
  visibleRows,
}: ResultsFooterProps) {
  const t = useTranslations("search");

  return (
    <TableFooterContent>
      <div className="flex min-w-0 items-center gap-2" role="status">
        <span className="whitespace-nowrap">
          {t("resultRange", { from: pageStart, to: pageEnd, total })}
        </span>
        {running || loading ? (
          <Spinner aria-label={t("working")} size="sm" />
        ) : null}
      </div>
      {failed && visibleRows ? (
        <span className="min-w-0 flex-1 truncate text-danger" role="alert">
          {t("failed")}
        </span>
      ) : null}
      {selectedCount ? (
        <Button onPress={onSaveSelected} size="sm" variant="secondary">
          <HugeiconsIcon
            className="size-4"
            icon={Bookmark01Icon}
            strokeWidth={2}
          />
          {t("saveSelected", { count: selectedCount })}
        </Button>
      ) : null}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-6">
        <div className="flex items-center gap-2">
          <Select
            aria-label={t("rowsPerPage")}
            className="w-24"
            onChange={(value) => {
              if (value !== null) {
                onPageSizeChange(Number(value));
              }
            }}
            placeholder={String(pageSize)}
            value={String(pageSize)}
          >
            <Label className="sr-only">{t("rowsPerPage")}</Label>
            <Select.Trigger className="h-9">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover placement="top end">
              <ListBox>
                {pageSizes.map((size) => (
                  <ListBox.Item
                    id={String(size)}
                    key={size}
                    textValue={String(size)}
                  >
                    {size}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <span className="hidden whitespace-nowrap lg:inline">
            {t("rowsPerPage")}
          </span>
        </div>
        <Pagination size="sm">
          <Pagination.Summary className="hidden whitespace-nowrap sm:block">
            {t("page", {
              current: pageIndex + 1,
              total: Math.max(pageCount, 1),
            })}
          </Pagination.Summary>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={!canPrevious}
                onPress={onPrevious}
              >
                <Pagination.PreviousIcon />
                <span className="sr-only">{t("previous")}</span>
              </Pagination.Previous>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Next isDisabled={!canNext} onPress={onNext}>
                <span className="sr-only">{t("next")}</span>
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      </div>
    </TableFooterContent>
  );
}

type TableFooterContentProps = Readonly<{ children: ReactNode }>;

/** Provides the responsive content row inside a native HeroUI table footer. */
function TableFooterContent({ children }: TableFooterContentProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 text-muted text-sm">
      {children}
    </div>
  );
}
