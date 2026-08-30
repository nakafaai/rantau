"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Bookmark01Icon,
} from "@hugeicons/core-free-icons";
import { api } from "@repo/backend/convex/_generated/api";
import { Button } from "@repo/design-system/components/ui/button";
import { HugeIcons } from "@repo/design-system/components/ui/huge-icons";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
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
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useResultColumns } from "@/components/columns";
import {
  type OpportunityRecord,
  OpportunitySheet,
} from "@/components/opportunity";

type ResultsProps = Readonly<{ records: readonly OpportunityRecord[] }>;

/** Renders a full TanStack data table with selection and row actions. */
export function Results({ records }: ResultsProps) {
  const t = useTranslations("search");
  const common = useTranslations("common");
  const save = useMutation(api.applications.save);
  const saveMany = useMutation(api.applications.saveMany);
  const [active, setActive] = useState<OpportunityRecord | null>(null);
  const [filter, setFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([
    { desc: true, id: "recommendation" },
  ]);
  const saveOne = useCallback(
    /** Saves one row from its action menu. */
    async (record: OpportunityRecord) => {
      try {
        await save({ opportunityId: record.opportunity._id });
        toast.success(t("saved"));
      } catch {
        toast.error(common("error"));
      }
    },
    [common, save, t]
  );
  const columns = useResultColumns({ onDetails: setActive, onSave: saveOne });
  const table = useReactTable({
    columns,
    data: [...records],
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (record) => record.opportunity._id,
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
    onGlobalFilterChange: setFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelection,
    onSortingChange: setSorting,
    state: {
      globalFilter: filter,
      pagination,
      rowSelection: selection,
      sorting,
    },
  });
  const selected = table.getSelectedRowModel().rows;

  /** Saves every selected page row through one atomic Convex mutation. */
  async function saveSelected() {
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground text-sm">
            {records.length} {t("results")}
          </p>
          {selected.length ? (
            <Button onClick={saveSelected} size="sm" variant="outline">
              <HugeIcons className="size-4" icon={Bookmark01Icon} />
              {t("saveSelected", { count: selected.length })}
            </Button>
          ) : null}
        </div>
        <Input
          className="sm:max-w-72"
          onChange={(event) => setFilter(event.target.value)}
          placeholder={t("filterResults")}
          value={filter}
        />
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table className="min-w-[1180px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  {t("noFilteredResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <span>{t("rowsPerPage")}</span>
          <Select
            onValueChange={(value) => table.setPageSize(Number(value))}
            value={String(table.getState().pagination.pageSize)}
          >
            <SelectTrigger className="w-20" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {[10, 25, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {t("page", {
              current: table.getState().pagination.pageIndex + 1,
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
      </div>

      <OpportunitySheet
        onOpenChange={(open) => {
          if (!open) {
            setActive(null);
          }
        }}
        open={active !== null}
        record={active}
      />
    </div>
  );
}
