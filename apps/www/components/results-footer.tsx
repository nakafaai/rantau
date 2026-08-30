"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Bookmark01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@repo/design-system/components/ui/button";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { useTranslations } from "next-intl";

type ResultsFooterProps = Readonly<{
  canNext: boolean;
  canPrevious: boolean;
  currentPage: number;
  failed: boolean;
  from: number;
  hasRows: boolean;
  onNext: () => void;
  onPageSizeChange: (pageSize: number) => void;
  onPrevious: () => void;
  onSaveSelected: () => void;
  pageCount: number;
  pageSize: number;
  selectedCount: number;
  to: number;
  total: number;
  working: boolean;
}>;

/** Renders readable result progress and clearly separated pagination groups. */
export function ResultsFooter({
  canNext,
  canPrevious,
  currentPage,
  failed,
  from,
  hasRows,
  onNext,
  onPageSizeChange,
  onPrevious,
  onSaveSelected,
  pageCount,
  pageSize,
  selectedCount,
  to,
  total,
  working,
}: ResultsFooterProps) {
  const t = useTranslations("search");

  return (
    <footer className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-t bg-muted/20 px-4 py-2.5 text-muted-foreground text-sm">
      <div className="flex items-center gap-2" role="status">
        <span className="whitespace-nowrap">
          {t("resultRange", { from, to, total })}
        </span>
        {working ? (
          <HugeIcons className="size-4 animate-spin" icon={Loading03Icon} />
        ) : null}
        <span className="sr-only">{working ? t("working") : ""}</span>
      </div>
      {failed && hasRows ? (
        <span className="min-w-0 flex-1 truncate text-destructive" role="alert">
          {t("failed")}
        </span>
      ) : null}
      {selectedCount ? (
        <Button onClick={onSaveSelected} size="sm" variant="outline">
          <HugeIcons className="size-4" icon={Bookmark01Icon} />
          {t("saveSelected", { count: selectedCount })}
        </Button>
      ) : null}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <span className="hidden whitespace-nowrap lg:inline">
            {t("rowsPerPage")}
          </span>
          <Select
            onValueChange={(value) => onPageSizeChange(Number(value))}
            value={String(pageSize)}
          >
            <SelectTrigger
              aria-label={t("rowsPerPage")}
              className="w-16"
              size="sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {[10, 25, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden whitespace-nowrap sm:inline">
            {t("page", { current: currentPage, total: pageCount })}
          </span>
          <Button
            aria-label={t("previous")}
            disabled={!canPrevious}
            onClick={onPrevious}
            size="icon-sm"
            variant="outline"
          >
            <HugeIcons className="size-4" icon={ArrowLeft01Icon} />
          </Button>
          <Button
            aria-label={t("next")}
            disabled={!canNext}
            onClick={onNext}
            size="icon-sm"
            variant="outline"
          >
            <HugeIcons className="size-4" icon={ArrowRight01Icon} />
          </Button>
        </div>
      </div>
    </footer>
  );
}
