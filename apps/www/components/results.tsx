"use client";

import type { Id } from "@repo/backend/convex/_generated/dataModel";
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
import { useResultColumns } from "@/components/columns";
import { OpportunitySheet } from "@/components/opportunity";
import { ResultsFooter } from "@/components/results-footer";
import { useSaveApplication, useSaveApplications } from "@/hooks/applications";
import type { OpportunityRecord } from "@/lib/opportunity";
import { resultColumnClass } from "@/lib/result-column";

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
        className="min-w-full table-auto"
        containerClassName="min-h-0 flex-1 overflow-auto overscroll-contain [scrollbar-gutter:stable]"
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

      <ResultsFooter
        canNext={table.getCanNextPage()}
        canPrevious={table.getCanPreviousPage()}
        currentPage={pagination.pageIndex + 1}
        failed={failed}
        from={pageStart}
        hasRows={rows.length > 0}
        onNext={() => table.nextPage()}
        onPageSizeChange={(pageSize) => table.setPageSize(pageSize)}
        onPrevious={() => table.previousPage()}
        onSaveSelected={saveSelected}
        pageCount={Math.max(table.getPageCount(), 1)}
        pageSize={pagination.pageSize}
        selectedCount={selected.length}
        to={pageEnd}
        total={records.length}
        working={running || loading}
      />

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
