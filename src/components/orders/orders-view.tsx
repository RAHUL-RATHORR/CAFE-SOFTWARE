"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Copy, Eye, Pencil, Trash2 } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { Pagination } from "@/components/tables/pagination";
import { PageSizeSelector } from "@/components/tables/page-size-selector";
import { SortButton } from "@/components/tables/sort-button";
import { TableEmptyState } from "@/components/tables/table-empty-state";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { FilterDropdown } from "@/components/tables/filter-dropdown";
import { BulkActionBar } from "@/components/tables/bulk-action-bar";
import { DsBadge } from "@/components/badges/ds-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import {
  deleteOrder,
  duplicateOrder,
} from "@/actions/orders";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANTS,
  ORDER_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_VARIANTS,
  isOrderEditable,
} from "@/config/orders";
import { formatOrderDate, formatOrderMoney } from "@/lib/orders";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type {
  OrderFormOptions,
  RestaurantOrder,
  RestaurantOrderListResult,
} from "@/types/order";
import type { SortDirection } from "@/types";
import {
  ORDER_STATUSES,
  ORDER_TYPES,
  PAYMENT_STATUSES,
} from "@/types/order";

const statusFilterOptions = [
  { label: "All statuses", value: "all" },
  ...ORDER_STATUSES.map((value) => ({
    value,
    label: ORDER_STATUS_LABELS[value],
  })),
];

const orderTypeFilterOptions = [
  { label: "All types", value: "all" },
  ...ORDER_TYPES.map((value) => ({
    value,
    label: ORDER_TYPE_LABELS[value],
  })),
];

const paymentFilterOptions = [
  { label: "All payments", value: "all" },
  ...PAYMENT_STATUSES.map((value) => ({
    value,
    label: PAYMENT_STATUS_LABELS[value],
  })),
];

type OrdersViewProps = {
  result: RestaurantOrderListResult;
  filterOptions: Pick<OrderFormOptions, "tables" | "customers">;
  query: {
    q: string;
    status: string;
    orderType: string;
    paymentStatus: string;
    tableId: string;
    customerId: string;
    dateFrom: string;
    dateTo: string;
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  errorMessage?: string | null;
};

export function OrdersView({
  result,
  filterOptions,
  query,
  errorMessage,
}: OrdersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query.q);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const canCreate = useHasPermission(["orders.create", "orders.manage"]);
  const canEdit = useHasPermission(["orders.edit", "orders.manage"]);
  const canDelete = useHasPermission(["orders.delete", "orders.manage"]);

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
  }, [query.q]);

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

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === result.items.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(result.items.map((item) => item.id));
  }

  function handleDelete(order: RestaurantOrder) {
    openConfirmDialog("delete", {
      title: `Delete “${order.orderNumber}”?`,
      description: "This order will be soft-deleted and hidden from the list.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const deleteResult = await deleteOrder({ id: order.id });
        if (!deleteResult.success) {
          toast.error(deleteResult.error.message);
          return;
        }
        toast.success("Order deleted", order.orderNumber);
        router.refresh();
      },
    });
  }

  function handleDuplicate(order: RestaurantOrder) {
    startTransition(async () => {
      const result = await duplicateOrder({ id: order.id });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Order duplicated", result.data.orderNumber);
      router.push(`/orders/${result.data.id}`);
      router.refresh();
    });
  }

  const hasFilters =
    Boolean(query.q) ||
    query.status !== "all" ||
    query.orderType !== "all" ||
    query.paymentStatus !== "all" ||
    Boolean(query.tableId) ||
    Boolean(query.customerId) ||
    Boolean(query.dateFrom) ||
    Boolean(query.dateTo);

  const tableFilterOptions = [
    { label: "All tables", value: "all" },
    ...filterOptions.tables,
  ];
  const customerFilterOptions = [
    { label: "All customers", value: "all" },
    ...filterOptions.customers,
  ];

  return (
    <AppCard
      title="All orders"
      description="Search, filter, and manage restaurant orders"
      className="shadow-sm"
      contentClassName="space-y-4"
    >
      <TableToolbar
        searchPlaceholder="Search order #, item, or notes…"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusOptions={statusFilterOptions}
        statusValue={query.status}
        onStatusChange={(value) => updateParams({ status: value })}
        onRefresh={() => router.refresh()}
        trailing={
          canCreate.allowed ? (
            <Link
              href="/orders/new"
              className={cn(buttonVariants({ size: "default" }), "rounded-xl")}
            >
              New order
            </Link>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Order type filter"
          options={orderTypeFilterOptions}
          value={query.orderType || "all"}
          onChange={(value) =>
            updateParams({ orderType: value === "all" ? undefined : value })
          }
        />
        <FilterDropdown
          label="Payment status filter"
          options={paymentFilterOptions}
          value={query.paymentStatus || "all"}
          onChange={(value) =>
            updateParams({
              paymentStatus: value === "all" ? undefined : value,
            })
          }
        />
        <FilterDropdown
          label="Table filter"
          options={tableFilterOptions}
          value={query.tableId || "all"}
          onChange={(value) =>
            updateParams({ tableId: value === "all" ? undefined : value })
          }
        />
        <FilterDropdown
          label="Customer filter"
          options={customerFilterOptions}
          value={query.customerId || "all"}
          onChange={(value) =>
            updateParams({ customerId: value === "all" ? undefined : value })
          }
        />
        <Input
          type="date"
          aria-label="From date"
          value={query.dateFrom}
          className="h-9 w-auto rounded-xl"
          onChange={(event) =>
            updateParams({ dateFrom: event.target.value || undefined })
          }
        />
        <Input
          type="date"
          aria-label="To date"
          value={query.dateTo}
          className="h-9 w-auto rounded-xl"
          onChange={(event) =>
            updateParams({ dateTo: event.target.value || undefined })
          }
        />
      </div>

      {/* FUTURE PLACEHOLDER — bulk selection actions */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
      />

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      ) : null}

      {isPending ? (
        <TableLoadingSkeleton rows={6} columns={8} />
      ) : result.items.length === 0 ? (
        <TableEmptyState
          title={hasFilters ? "No matching orders" : "No orders yet"}
          description={
            hasFilters
              ? "Try adjusting search or filters."
              : "Create your first order to get started."
          }
          actionLabel={canCreate.allowed ? "Create order" : undefined}
          onAction={
            canCreate.allowed ? () => router.push("/orders/new") : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all orders"
                    checked={
                      result.items.length > 0 &&
                      selectedIds.length === result.items.length
                    }
                    onChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Order #"
                    direction={sortDirectionFor("orderNumber")}
                    onToggle={() => toggleSort("orderNumber")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Type"
                    direction={sortDirectionFor("orderType")}
                    onToggle={() => toggleSort("orderType")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Status"
                    direction={sortDirectionFor("status")}
                    onToggle={() => toggleSort("status")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Payment"
                    direction={sortDirectionFor("paymentStatus")}
                    onToggle={() => toggleSort("paymentStatus")}
                  />
                </TableHead>
                <TableHead>Customer / Table</TableHead>
                <TableHead className="text-right">
                  <SortButton
                    label="Total"
                    direction={sortDirectionFor("grandTotal")}
                    onToggle={() => toggleSort("grandTotal")}
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
              {result.items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`Select ${order.orderNumber}`}
                      checked={selectedIds.includes(order.id)}
                      onChange={() => toggleSelected(order.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/orders/${order.id}`}
                      className="hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{ORDER_TYPE_LABELS[order.orderType]}</TableCell>
                  <TableCell>
                    <DsBadge variant={ORDER_STATUS_VARIANTS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </DsBadge>
                  </TableCell>
                  <TableCell>
                    <DsBadge
                      variant={PAYMENT_STATUS_VARIANTS[order.paymentStatus]}
                    >
                      {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                    </DsBadge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <p>{order.customerLabel ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.tableLabel ?? "No table"}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatOrderMoney(order.grandTotal)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatOrderDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/orders/${order.id}`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon" }),
                          "size-8"
                        )}
                        aria-label={`View ${order.orderNumber}`}
                      >
                        <Eye className="size-4" />
                      </Link>
                      {canEdit.allowed && isOrderEditable(order.status) ? (
                        <Link
                          href={`/orders/${order.id}/edit`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "size-8"
                          )}
                          aria-label={`Edit ${order.orderNumber}`}
                        >
                          <Pencil className="size-4" />
                        </Link>
                      ) : null}
                      {canCreate.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Duplicate ${order.orderNumber}`}
                          onClick={() => handleDuplicate(order)}
                        >
                          <Copy className="size-4" />
                        </Button>
                      ) : null}
                      {canDelete.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          aria-label={`Delete ${order.orderNumber}`}
                          onClick={() => handleDelete(order)}
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
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageSizeSelector
          value={query.pageSize}
          onChange={(pageSize) => updateParams({ pageSize, page: 1 })}
        />
        <Pagination
          page={result.meta.page}
          totalPages={result.meta.totalPages}
          onPageChange={(page) => updateParams({ page })}
        />
      </div>
    </AppCard>
  );
}
