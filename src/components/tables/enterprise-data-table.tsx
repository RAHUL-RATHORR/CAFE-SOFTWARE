"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { AppCard } from "@/components/cards/app-card";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { BulkActionBar } from "@/components/tables/bulk-action-bar";
import { TableHeader, TableHeaderCell } from "@/components/tables/table-header";
import { TableRow } from "@/components/tables/table-row";
import { TableCell } from "@/components/tables/table-cell";
import { SortButton } from "@/components/tables/sort-button";
import { StatusBadge } from "@/components/tables/status-badge";
import { Pagination } from "@/components/tables/pagination";
import { PageSizeSelector } from "@/components/tables/page-size-selector";
import { TableEmptyState } from "@/components/tables/table-empty-state";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import {
  sampleCategoryFilterOptions,
  sampleStatusFilterOptions,
  sampleTableRows,
} from "@/components/tables/data/sample-table-data";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { SampleTableRow, SortDirection } from "@/types";

type EnterpriseDataTableProps = {
  title?: string;
  description?: string;
  data?: SampleTableRow[];
  isLoading?: boolean;
  className?: string;
};

type ColumnConfig = {
  id: keyof SampleTableRow | "select";
  label: string;
  canHide: boolean;
  enableSorting?: boolean;
  className?: string;
  render: (row: SampleTableRow) => ReactNode;
};

/**
 * Full enterprise data table shell (UI only).
 * Search, filters, sort, and pagination are presentational — no data logic.
 */
export function EnterpriseDataTable({
  title = "Records",
  description = "Enterprise data table foundation with reusable toolbar and controls",
  data = sampleTableRows,
  isLoading = false,
  className,
}: EnterpriseDataTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    select: true,
    id: true,
    name: true,
    status: true,
    date: true,
    amount: true,
    category: true,
    createdBy: true,
    lastUpdated: true,
  });

  const columns: ColumnConfig[] = useMemo(
    () => [
      {
        id: "select",
        label: "Select",
        canHide: false,
        className: "w-12",
        render: (row) => (
          <input
            type="checkbox"
            className="size-3.5 rounded border-input accent-primary"
            aria-label={`Select ${row.id}`}
            checked={selectedIds.includes(row.id)}
            onChange={(event) => {
              setSelectedIds((current) =>
                event.target.checked
                  ? [...current, row.id]
                  : current.filter((id) => id !== row.id)
              );
            }}
          />
        ),
      },
      {
        id: "id",
        label: "ID",
        canHide: true,
        enableSorting: true,
        render: (row) => <span className="font-medium">{row.id}</span>,
      },
      {
        id: "name",
        label: "Name",
        canHide: true,
        enableSorting: true,
        render: (row) => row.name,
      },
      {
        id: "status",
        label: "Status",
        canHide: true,
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        id: "date",
        label: "Date",
        canHide: true,
        enableSorting: true,
        render: (row) => row.date,
      },
      {
        id: "amount",
        label: "Amount",
        canHide: true,
        enableSorting: true,
        className: "text-right",
        render: (row) => formatCurrency(row.amount),
      },
      {
        id: "category",
        label: "Category",
        canHide: true,
        render: (row) => row.category,
      },
      {
        id: "createdBy",
        label: "Created By",
        canHide: true,
        render: (row) => row.createdBy,
      },
      {
        id: "lastUpdated",
        label: "Last Updated",
        canHide: true,
        render: (row) => row.lastUpdated,
      },
    ],
    [selectedIds]
  );

  const activeColumns = columns.filter((column) => visibleColumns[column.id]);

  const visibilityItems = columns
    .filter((column) => column.id !== "select")
    .map((column) => ({
      id: column.id,
      label: column.label,
      visible: visibleColumns[column.id] ?? true,
      canHide: column.canHide,
    }));

  const toggleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    if (sortDirection === "desc") {
      setSortKey(null);
      setSortDirection(null);
      return;
    }

    setSortDirection("asc");
  };

  const allSelected =
    data.length > 0 && data.every((row) => selectedIds.includes(row.id));

  return (
    <AppCard
      title={title}
      description={description}
      className={cn("shadow-sm", className)}
      contentClassName="space-y-4 pt-4"
    >
      <TableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        statusOptions={sampleStatusFilterOptions}
        statusValue={status}
        onStatusChange={setStatus}
        categoryOptions={sampleCategoryFilterOptions}
        categoryValue={category}
        onCategoryChange={setCategory}
        dateValue={date}
        onDateChange={setDate}
        columns={visibilityItems}
        onColumnVisibilityChange={(columnId, visible) =>
          setVisibleColumns((current) => ({ ...current, [columnId]: visible }))
        }
        selectedCount={selectedIds.length}
        onRefresh={() => undefined}
        onExport={() => undefined}
        onImport={() => undefined}
      />

      <BulkActionBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
      />

      {isLoading ? (
        <TableLoadingSkeleton columns={activeColumns.length} />
      ) : data.length === 0 ? (
        <TableEmptyState />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <div className="max-h-[480px] overflow-auto">
            <Table>
              <TableHeader>
                {activeColumns.map((column) => (
                  <TableHeaderCell key={column.id} className={column.className}>
                    {column.id === "select" ? (
                      <input
                        type="checkbox"
                        className="size-3.5 rounded border-input accent-primary"
                        aria-label="Select all rows"
                        checked={allSelected}
                        onChange={(event) => {
                          setSelectedIds(
                            event.target.checked ? data.map((row) => row.id) : []
                          );
                        }}
                      />
                    ) : column.enableSorting ? (
                      <SortButton
                        label={column.label}
                        direction={sortKey === column.id ? sortDirection : null}
                        onToggle={() => toggleSort(column.id)}
                      />
                    ) : (
                      column.label
                    )}
                  </TableHeaderCell>
                ))}
              </TableHeader>
              <TableBody>
                {data.map((row) => {
                  const selected = selectedIds.includes(row.id);
                  return (
                    <TableRow key={row.id} selected={selected}>
                      {activeColumns.map((column) => (
                        <TableCell key={column.id} className={column.className}>
                          {column.render(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <PageSizeSelector
          value={pageSize}
          onChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
        <Pagination
          page={page}
          totalPages={Math.max(1, Math.ceil(data.length / pageSize))}
          onPageChange={setPage}
        />
      </div>
    </AppCard>
  );
}
