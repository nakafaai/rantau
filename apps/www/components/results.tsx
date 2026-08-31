"use client";

import { EmptyState, Skeleton, Table, toast } from "@heroui/react";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
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
  sourceCapacityReached: boolean;
}>;

/** Renders stable table rows while the first realtime records arrive. */
function LoadingRows({
  columns,
  count,
}: Readonly<{ columns: readonly string[]; count: number }>) {
  return LOADING_ROW_KEYS.slice(0, count).map((rowKey) => (
    <Table.Row className="h-16" id={`loading-${rowKey}`} key={rowKey}>
      {columns.map((columnId, columnIndex) => (
        <Table.Cell
          className={resultColumnClass(columnId)}
          key={`${rowKey}-${columnId}`}
        >
          <Skeleton className={columnIndex === 1 ? "h-4 w-3/4" : "h-4 w-2/3"} />
        </Table.Cell>
      ))}
    </Table.Row>
  ));
}

/** Renders a full-height results table with realtime rows and stable pagination. */
export function Results({
  failed,
  loading,
  records,
  running,
  sourceCapacityReached,
}: ResultsProps) {
  "use no memo";

  const t = useTranslations("search");
  const common = useTranslations("common");
  const save = useSaveApplication();
  const saveMany = useSaveApplications();
  const [activeId, setActiveId] = useState<Id<"opportunities"> | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
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
    (record: OpportunityRecord) => {
      setActiveId(record.opportunity._id);
      setDetailsOpen(true);
    },
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
        toast.danger(common("error"));
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
  const [activeSort] = sorting;
  let emptyMessage = t("noResults");
  if (failed) {
    emptyMessage = t("failed");
  }
  if (sourceCapacityReached) {
    emptyMessage = t("failedCapacity");
  }

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
      toast.danger(common("error"));
    }
  }

  return (
    <Table
      aria-busy={loading || running}
      className="min-h-0 w-full min-w-0 flex-1 grid-rows-[minmax(0,1fr)_auto]"
    >
      <Table.ScrollContainer className="h-full min-h-0 overflow-auto overscroll-contain [container-type:inline-size]">
        <Table.Content
          aria-label={t("title")}
          className={
            rows.length || loadingRows
              ? "min-w-[112rem] table-auto"
              : "h-full min-w-full table-auto"
          }
          onSortChange={(descriptor) =>
            setSorting([
              {
                desc: descriptor.direction === "descending",
                id: String(descriptor.column),
              },
            ])
          }
          sortDescriptor={
            activeSort
              ? {
                  column: activeSort.id,
                  direction: activeSort.desc ? "descending" : "ascending",
                }
              : undefined
          }
        >
          <Table.Header>
            {table.getHeaderGroups()[0]?.headers.map((header) => (
              <Table.Column
                allowsSorting={header.column.id === "recommendation"}
                className={resultColumnClass(header.column.id, "header")}
                id={header.column.id}
                isRowHeader={header.column.id === "role"}
                key={header.id}
              >
                {({ sortDirection }) => {
                  if (header.isPlaceholder) {
                    return null;
                  }
                  const content = flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  );
                  if (header.column.id !== "recommendation") {
                    return content;
                  }
                  return (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                      {content}
                    </Table.SortableColumnHeader>
                  );
                }}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <EmptyState className="sticky left-0 flex h-full min-h-40 w-[100cqw] flex-col items-center justify-center gap-4 px-6 text-center text-muted text-sm">
                {emptyMessage}
              </EmptyState>
            )}
          >
            {rows.map((row) => (
              <Table.Row
                className="group h-16"
                data-selected={row.getIsSelected() || undefined}
                id={row.id}
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell
                    className={resultColumnClass(cell.column.id)}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
            {loadingRows ? (
              <LoadingRows
                columns={table.getAllLeafColumns().map((column) => column.id)}
                count={loadingRows}
              />
            ) : null}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>

      <Table.Footer className="min-h-12 overflow-hidden">
        <ResultsFooter
          canNext={table.getCanNextPage()}
          canPrevious={table.getCanPreviousPage()}
          failed={failed}
          loading={loading}
          onNext={() => table.nextPage()}
          onPageSizeChange={(size) => table.setPageSize(size)}
          onPrevious={() => table.previousPage()}
          onSaveSelected={saveSelected}
          pageCount={table.getPageCount()}
          pageEnd={pageEnd}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          pageStart={pageStart}
          running={running}
          selectedCount={selected.length}
          total={records.length}
          visibleRows={rows.length}
        />
      </Table.Footer>

      <OpportunitySheet
        onOpenChange={setDetailsOpen}
        open={detailsOpen}
        record={active}
      />
    </Table>
  );
}
