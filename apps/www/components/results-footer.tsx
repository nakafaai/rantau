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
        <span className="whitespace-nowrap sm:hidden">
          {t("resultCount", { total })}
        </span>
        <span className="hidden whitespace-nowrap sm:inline">
          {t("resultRange", { from: pageStart, to: pageEnd, total })}
        </span>
        {running || loading ? (
          <Spinner aria-label={t("working")} size="sm" />
        ) : null}
      </div>
      {failed && visibleRows ? (
        <span
          className="sr-only text-danger md:not-sr-only md:min-w-0 md:flex-1 md:truncate"
          role="alert"
        >
          {t("failed")}
        </span>
      ) : null}
      {selectedCount ? (
        <Button
          aria-label={t("saveSelected", { count: selectedCount })}
          className="shrink-0"
          onPress={onSaveSelected}
          size="sm"
          variant="secondary"
        >
          <HugeiconsIcon
            className="size-4"
            icon={Bookmark01Icon}
            strokeWidth={2}
          />
          <span className="hidden sm:inline">
            {t("saveSelected", { count: selectedCount })}
          </span>
        </Button>
      ) : null}
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden whitespace-nowrap sm:inline">
            {t("rowsPerPage")}
          </span>
          <Select
            aria-label={t("rowsPerPage")}
            className="w-16 sm:w-20"
            onChange={(value) => {
              if (value !== null) {
                onPageSizeChange(Number(value));
              }
            }}
            placeholder={String(pageSize)}
            value={String(pageSize)}
          >
            <Label className="sr-only">{t("rowsPerPage")}</Label>
            <Select.Trigger>
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
        </div>
        {pageCount > 1 ? (
          <Pagination className="shrink-0 flex-row gap-2 sm:gap-4" size="sm">
            <Pagination.Summary className="hidden whitespace-nowrap md:block">
              {t("page", {
                current: pageIndex + 1,
                total: pageCount,
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
        ) : null}
      </div>
    </TableFooterContent>
  );
}

type TableFooterContentProps = Readonly<{ children: ReactNode }>;

/** Provides the responsive content row inside a native HeroUI table footer. */
function TableFooterContent({ children }: TableFooterContentProps) {
  return (
    <div className="flex w-full min-w-0 items-center gap-2 text-muted text-sm sm:gap-4">
      {children}
    </div>
  );
}
