"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Eye, LayoutGrid, List, Pencil, Power, Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AppCard } from "@/components/cards/app-card";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { Pagination } from "@/components/tables/pagination";
import { PageSizeSelector } from "@/components/tables/page-size-selector";
import { SortButton } from "@/components/tables/sort-button";
import { TableEmptyState } from "@/components/tables/table-empty-state";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { FilterDropdown } from "@/components/tables/filter-dropdown";
import { DsBadge } from "@/components/badges/ds-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { RestaurantTableCards } from "@/components/restaurant-tables/restaurant-table-cards";
import { deleteTable, updateTableStatus } from "@/actions/tables";
import {
  FLOOR_OPTIONS,
  TABLE_STATUS_LABELS,
} from "@/config/tables";
import { formatRestaurantTableDate } from "@/lib/restaurant-tables";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type {
  RestaurantTable,
  RestaurantTableListResult,
  RestaurantTableStatus,
} from "@/types/restaurant-table";
import type { SortDirection } from "@/types";

const statusFilterOptions = [
  { label: "All statuses", value: "all" },
  ...Object.entries(TABLE_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const activeFilterOptions = [
  { label: "All active", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const floorFilterOptions = [
  { label: "All floors", value: "all" },
  ...FLOOR_OPTIONS,
];

const statusVariant: Record<
  RestaurantTableStatus,
  "success" | "warning" | "info" | "secondary" | "danger"
> = {
  available: "success",
  reserved: "warning",
  occupied: "info",
  cleaning: "secondary",
  "out-of-service": "danger",
};

type RestaurantTablesViewProps = {
  result: RestaurantTableListResult;
  query: {
    q: string;
    status: string;
    floorId: string;
    minCapacity: string;
    maxCapacity: string;
    active: string;
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
    view: "table" | "cards";
  };
  errorMessage?: string | null;
};

export function RestaurantTablesView({
  result,
  query,
  errorMessage,
}: RestaurantTablesViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query.q);
  const [minCapacity, setMinCapacity] = useState(query.minCapacity);
  const [maxCapacity, setMaxCapacity] = useState(query.maxCapacity);

  const canCreate = useHasPermission(["tables.create", "tables.manage"]);
  const canEdit = useHasPermission(["tables.edit", "tables.manage"]);
  const canDelete = useHasPermission(["tables.delete", "tables.manage"]);

  const updateParams = useCallback(
    (patch: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      if (!("page" in patch)) {
        params.set("page", "1");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    setSearchValue(query.q);
    setMinCapacity(query.minCapacity);
    setMaxCapacity(query.maxCapacity);
  }, [query.q, query.minCapacity, query.maxCapacity]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchValue === query.q) return;
      updateParams({ q: searchValue });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchValue, query.q, updateParams]);

  function sortDirectionFor(field: string): SortDirection {
    if (query.sortBy !== field) return null;
    return query.sortOrder;
  }

  function toggleSort(field: string) {
    const nextOrder =
      query.sortBy === field && query.sortOrder === "asc" ? "desc" : "asc";
    updateParams({ sortBy: field, sortOrder: nextOrder, page: 1 });
  }

  function handleDelete(table: RestaurantTable) {
    openConfirmDialog("delete", {
      title: `Delete “${table.tableName}”?`,
      description: "This table will be soft-deleted and hidden from the list.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const deleteResult = await deleteTable({ id: table.id });
        if (!deleteResult.success) {
          toast.error(deleteResult.error.message);
          return;
        }
        toast.success("Table deleted", table.tableName);
        router.refresh();
      },
    });
  }

  function cycleStatus(table: RestaurantTable) {
    const order: RestaurantTableStatus[] = [
      "available",
      "reserved",
      "occupied",
      "cleaning",
      "out-of-service",
    ];
    const index = order.indexOf(table.status);
    const next = order[(index + 1) % order.length];
    startTransition(async () => {
      const result = await updateTableStatus({ id: table.id, status: next });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Status updated", TABLE_STATUS_LABELS[result.data.status]);
      router.refresh();
    });
  }

  return (
    <AppCard
      title="All tables"
      description="Search, filter, and manage dining tables"
      className="shadow-sm"
      contentClassName="space-y-4"
      action={
        <div className="flex items-center gap-1 rounded-xl border border-border p-1">
          <Button
            type="button"
            variant={query.view === "table" ? "secondary" : "ghost"}
            size="icon"
            className="size-8 rounded-lg"
            aria-label="Table view"
            aria-pressed={query.view === "table"}
            onClick={() => updateParams({ view: "table" })}
          >
            <List className="size-4" />
          </Button>
          <Button
            type="button"
            variant={query.view === "cards" ? "secondary" : "ghost"}
            size="icon"
            className="size-8 rounded-lg"
            aria-label="Card view"
            aria-pressed={query.view === "cards"}
            onClick={() => updateParams({ view: "cards" })}
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
      }
    >
      <TableToolbar
        searchPlaceholder="Search number or name…"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusOptions={statusFilterOptions}
        statusValue={query.status}
        onStatusChange={(value) => updateParams({ status: value })}
        onRefresh={() => router.refresh()}
        trailing={
          canCreate.allowed ? (
            <Link
              href="/tables/new"
              className={cn(buttonVariants({ size: "default" }), "rounded-xl")}
            >
              New table
            </Link>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Floor filter"
          options={floorFilterOptions}
          value={query.floorId || "all"}
          onChange={(value) =>
            updateParams({ floorId: value === "all" ? undefined : value })
          }
        />
        <FilterDropdown
          label="Active filter"
          options={activeFilterOptions}
          value={query.active}
          onChange={(value) => updateParams({ active: value })}
        />
        <Input
          type="number"
          min={1}
          placeholder="Min seats"
          aria-label="Minimum capacity"
          value={minCapacity}
          className="h-9 w-28 rounded-xl"
          onChange={(event) => setMinCapacity(event.target.value)}
          onBlur={() => updateParams({ minCapacity })}
        />
        <Input
          type="number"
          min={1}
          placeholder="Max seats"
          aria-label="Maximum capacity"
          value={maxCapacity}
          className="h-9 w-28 rounded-xl"
          onChange={(event) => setMaxCapacity(event.target.value)}
          onBlur={() => updateParams({ maxCapacity })}
        />
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {isPending ? <TableLoadingSkeleton rows={5} columns={7} /> : null}

      {!isPending && result.items.length === 0 ? (
        <TableEmptyState
          title="No tables found"
          description="Create your first table or adjust search filters."
          actionLabel={canCreate.allowed ? "Create table" : undefined}
          onAction={
            canCreate.allowed ? () => router.push("/tables/new") : undefined
          }
        />
      ) : null}

      {!isPending && result.items.length > 0 && query.view === "cards" ? (
        <RestaurantTableCards items={result.items} />
      ) : null}

      {!isPending && result.items.length > 0 && query.view === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton
                    label="Table number"
                    direction={sortDirectionFor("tableNumber")}
                    onToggle={() => toggleSort("tableNumber")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Name"
                    direction={sortDirectionFor("tableName")}
                    onToggle={() => toggleSort("tableName")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Capacity"
                    direction={sortDirectionFor("capacity")}
                    onToggle={() => toggleSort("capacity")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Status"
                    direction={sortDirectionFor("status")}
                    onToggle={() => toggleSort("status")}
                  />
                </TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>
                  <SortButton
                    label="Active"
                    direction={sortDirectionFor("isActive")}
                    onToggle={() => toggleSort("isActive")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Created"
                    direction={sortDirectionFor("createdAt")}
                    onToggle={() => toggleSort("createdAt")}
                  />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-mono text-xs">
                    {table.tableNumber}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/tables/${table.id}`}
                      className="font-medium hover:underline"
                    >
                      {table.tableName}
                    </Link>
                  </TableCell>
                  <TableCell>{table.capacity}</TableCell>
                  <TableCell>
                    <DsBadge
                      variant={statusVariant[table.status]}
                      size="sm"
                    >
                      {TABLE_STATUS_LABELS[table.status]}
                    </DsBadge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {table.floorLabel ?? "—"}
                  </TableCell>
                  <TableCell>
                    <DsBadge
                      variant={table.isActive ? "success" : "secondary"}
                      size="sm"
                    >
                      {table.isActive ? "Active" : "Inactive"}
                    </DsBadge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRestaurantTableDate(table.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-xl"
                        aria-label={`View ${table.tableName}`}
                        onClick={() => router.push(`/tables/${table.id}`)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {canEdit.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-xl"
                          aria-label={`Edit ${table.tableName}`}
                          onClick={() =>
                            router.push(`/tables/${table.id}/edit`)
                          }
                        >
                          <Pencil className="size-4" />
                        </Button>
                      ) : null}
                      {canEdit.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-xl"
                          aria-label={`Change status for ${table.tableName}`}
                          onClick={() => cycleStatus(table)}
                        >
                          <Power className="size-4" />
                        </Button>
                      ) : null}
                      {canDelete.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-xl text-destructive hover:text-destructive"
                          aria-label={`Delete ${table.tableName}`}
                          onClick={() => handleDelete(table)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {result.meta.total} table{result.meta.total === 1 ? "" : "s"}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <PageSizeSelector
            value={query.pageSize}
            onChange={(value) => updateParams({ pageSize: value, page: 1 })}
          />
          <Pagination
            page={result.meta.page}
            totalPages={result.meta.totalPages}
            onPageChange={(page) => updateParams({ page })}
          />
        </div>
      </div>
    </AppCard>
  );
}
