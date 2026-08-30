"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Bookmark01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { Button } from "@repo/design-system/components/ui/button";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { resultColumnClass, useResultColumns } from "@/components/columns";
import { OpportunitySheet } from "@/components/opportunity";
import { useSaveApplication, useSaveApplications } from "@/hooks/applications";
import type { OpportunityRecord } from "@/lib/opportunity";

const LOADING_ROW_COUNT = 6;
const LOADING_ROW_KEYS = [
  "alpha",
  "bravo",
  "charlie",
  "delta",
  "echo",
  "foxtrot",
] as const;

type ResultsProps = Readonly<{
  failed: boolean;
  loading: boolean;
  records: readonly OpportunityRecord[];
  running: boolean;
}>;

/** Renders stable table rows while the first realtime records arrive. */
function LoadingRows({
  columns,
  count,
}: Readonly<{ columns: readonly string[]; count: number }>) {
  return LOADING_ROW_KEYS.slice(0, count).map((rowKey) => (
    <TableRow className="h-14 hover:bg-transparent" key={rowKey}>
      {columns.map((columnId, columnIndex) => (
        <TableCell
          className={resultColumnClass(columnId)}
          key={`${rowKey}-${columnId}`}
        >
          <Skeleton className={columnIndex === 1 ? "h-4 w-3/4" : "h-4 w-2/3"} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

/** Renders a full-height results table with realtime rows and stable pagination. */
export function Results({ failed, loading, records, running }: ResultsProps) {
  "use no memo";

  const t = useTranslations("search");
  const common = useTranslations("common");
  const save = useSaveApplication();
  const saveMany = useSaveApplications();
  const [activeId, setActiveId] = useState<Id<"opportunities"> | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([
    { desc: true, id: "recommendation" },
  ]);
  const data = useMemo(() => [...records], [records]);
  const active =
    data.find((record) => record.opportunity._id === activeId) ?? null;
  const showDetails = useCallback(
    /** Opens one row without duplicating its realtime record in local state. */
    (record: OpportunityRecord) => setActiveId(record.opportunity._id),
    []
  );
  const saveOne = useCallback(
    /** Saves one opportunity with immediate local feedback. */
    async (record: OpportunityRecord) => {
      if (record.isSaved) {
        return;
      }
      try {
        await save({ opportunityId: record.opportunity._id });
        toast.success(t("saved"));
      } catch {
        toast.error(common("error"));
      }
    },
    [common, save, t]
  );
  const columns = useResultColumns({
    onDetails: showDetails,
    onSave: saveOne,
  });
  // TanStack Table intentionally manages mutable state outside React Compiler.
  // react-doctor-disable-next-line react-hooks-js/incompatible-library
  const table = useReactTable({
    columns,
    data,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (record) => record.opportunity._id,
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelection,
    onSortingChange: setSorting,
    state: { pagination, rowSelection: selection, sorting },
  });
  const { rows } = table.getRowModel();
  const selected = table
    .getSelectedRowModel()
    .rows.filter((row) => !row.original.isSaved);
  const pageStart = records.length
    ? pagination.pageIndex * pagination.pageSize + 1
    : 0;
  const pageEnd = records.length
    ? Math.min(pageStart + rows.length - 1, records.length)
    : 0;
  const loadingRows =
    running || loading ? Math.max(LOADING_ROW_COUNT - rows.length, 0) : 0;

  /** Saves every unsaved selected page row through one Convex mutation. */
  async function saveSelected() {
    if (!selected.length) {
      return;
    }
    try {
      await saveMany({
        opportunityIds: selected.map((row) => row.original.opportunity._id),
      });
      setSelection({});
      toast.success(t("selectedSaved", { count: selected.length }));
    } catch {
      toast.error(common("error"));
    }
  }

  return (
    <div
      aria-busy={loading || running}
      className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border"
    >
      <Table
        className="table-fixed"
        containerClassName="min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
      >
        <TableHeader className="sticky top-0 z-10 bg-background">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  className={resultColumnClass(header.column.id)}
                  key={header.id}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              aria-selected={row.getIsSelected()}
              className="h-14"
              data-state={row.getIsSelected() ? "selected" : undefined}
              key={row.id}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  className={resultColumnClass(cell.column.id)}
                  key={cell.id}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {loadingRows ? (
            <LoadingRows
              columns={table.getAllLeafColumns().map((column) => column.id)}
              count={loadingRows}
            />
          ) : null}
          {rows.length || loadingRows ? null : (
            <TableRow>
              <TableCell className="h-24 text-center" colSpan={columns.length}>
                {failed ? t("failed") : t("noResults")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <footer className="flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-t bg-muted/20 px-3 py-2 text-muted-foreground text-sm">
        <span className="whitespace-nowrap">
          {t("resultRange", {
            from: pageStart,
            to: pageEnd,
            total: records.length,
          })}
        </span>
        <span className="grid size-4 place-items-center" role="status">
          {running || loading ? (
            <HugeIcons className="size-4 animate-spin" icon={Loading03Icon} />
          ) : null}
          <span className="sr-only">
            {running || loading ? t("working") : ""}
          </span>
        </span>
        {failed && rows.length ? (
          <span
            className="min-w-0 flex-1 truncate text-destructive"
            role="alert"
          >
            {t("failed")}
          </span>
        ) : null}
        {selected.length ? (
          <Button onClick={saveSelected} size="sm" variant="outline">
            <HugeIcons className="size-4" icon={Bookmark01Icon} />
            {t("saveSelected", { count: selected.length })}
          </Button>
        ) : null}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden whitespace-nowrap lg:inline">
            {t("rowsPerPage")}
          </span>
          <Select
            onValueChange={(value) => table.setPageSize(Number(value))}
            value={String(pagination.pageSize)}
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
          <span className="hidden whitespace-nowrap sm:inline">
            {t("page", {
              current: pagination.pageIndex + 1,
              total: Math.max(table.getPageCount(), 1),
            })}
          </span>
          <Button
            aria-label={t("previous")}
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            size="icon-sm"
            variant="outline"
          >
            <HugeIcons className="size-4" icon={ArrowLeft01Icon} />
          </Button>
          <Button
            aria-label={t("next")}
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            size="icon-sm"
            variant="outline"
          >
            <HugeIcons className="size-4" icon={ArrowRight01Icon} />
          </Button>
        </div>
      </footer>

      <OpportunitySheet
        onOpenChange={(open) => {
          if (!open) {
            setActiveId(null);
          }
        }}
        open={active !== null}
        record={active}
      />
    </div>
  );
}
