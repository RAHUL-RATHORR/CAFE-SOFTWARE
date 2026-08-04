"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { deletePurchaseOrder } from "@/actions/purchases";
import {
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUS_VARIANTS,
} from "@/config/purchases";
import {
  formatPurchaseDate,
  formatPurchaseMoney,
} from "@/lib/purchases";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { PurchasesListQuery } from "@/components/purchases/purchases-list-view";
import type {
  PurchaseOrder,
  PurchaseOrderListResult,
} from "@/types/purchase";
import type { VendorSelectOption } from "@/types/vendor";
import type { SortDirection } from "@/types";

const statusFilterOptions = [
  { label: "All statuses", value: "all" },
  ...Object.entries(PURCHASE_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

type PurchasesViewProps = {
  result: PurchaseOrderListResult;
  query: PurchasesListQuery;
  vendors: VendorSelectOption[];
  errorMessage?: string | null;
};

export function PurchasesView({
  result,
  query,
  vendors,
  errorMessage,
}: PurchasesViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query.q);
  const [minAmount, setMinAmount] = useState(query.minAmount);
  const [maxAmount, setMaxAmount] = useState(query.maxAmount);

  const canCreate = useHasPermission([
    "purchases.create",
    "purchases.manage",
  ]);
  const canEdit = useHasPermission(["purchases.edit", "purchases.manage"]);
  const canDelete = useHasPermission([
    "purchases.delete",
    "purchases.manage",
  ]);

  const vendorFilterOptions = [
    { label: "All vendors", value: "all" },
    ...vendors.map((vendor) => ({
      value: vendor.value,
      label: vendor.label,
    })),
  ];

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
      if (!("page" in patch)) params.set("page", "1");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    setSearchValue(query.q);
    setMinAmount(query.minAmount);
    setMaxAmount(query.maxAmount);
  }, [query.q, query.minAmount, query.maxAmount]);

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

  function handleDelete(purchase: PurchaseOrder) {
    openConfirmDialog("delete", {
      title: `Delete “${purchase.purchaseNumber}”?`,
      description: "This purchase order will be cancelled and soft-deleted.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const deleteResult = await deletePurchaseOrder({ id: purchase.id });
        if (!deleteResult.success) {
          toast.error(deleteResult.error.message);
          return;
        }
        toast.success("Purchase deleted", purchase.purchaseNumber);
        router.refresh();
      },
    });
  }

  return (
    <AppCard
      title="Purchase orders"
      description="Search, filter, and track supplier purchases"
      className="shadow-sm"
      contentClassName="space-y-4"
    >
      <TableToolbar
        searchPlaceholder="Search purchase number or notes…"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusOptions={statusFilterOptions}
        statusValue={query.status}
        onStatusChange={(value) => updateParams({ status: value })}
        onRefresh={() => router.refresh()}
        trailing={
          canCreate.allowed ? (
            <Link
              href="/purchases/new"
              className={cn(buttonVariants(), "rounded-xl")}
            >
              New purchase
            </Link>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Vendor filter"
          options={vendorFilterOptions}
          value={query.vendorId || "all"}
          onChange={(value) =>
            updateParams({ vendorId: value === "all" ? undefined : value })
          }
        />
        <Input
          type="number"
          min={0}
          placeholder="Min amount"
          aria-label="Minimum amount"
          value={minAmount}
          className="h-9 w-28 rounded-xl"
          onChange={(event) => setMinAmount(event.target.value)}
          onBlur={() => updateParams({ minAmount })}
        />
        <Input
          type="number"
          min={0}
          placeholder="Max amount"
          aria-label="Maximum amount"
          value={maxAmount}
          className="h-9 w-28 rounded-xl"
          onChange={(event) => setMaxAmount(event.target.value)}
          onBlur={() => updateParams({ maxAmount })}
        />
        <Input
          type="date"
          aria-label="Date from"
          value={query.dateFrom}
          className="h-9 w-36 rounded-xl"
          onChange={(event) => updateParams({ dateFrom: event.target.value })}
        />
        <Input
          type="date"
          aria-label="Date to"
          value={query.dateTo}
          className="h-9 w-36 rounded-xl"
          onChange={(event) => updateParams({ dateTo: event.target.value })}
        />
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {isPending ? <TableLoadingSkeleton rows={5} columns={8} /> : null}

      {!isPending && result.items.length === 0 ? (
        <TableEmptyState
          title="No purchase orders found"
          description="Create a purchase order or adjust filters."
          actionLabel={canCreate.allowed ? "Create purchase" : undefined}
          onAction={
            canCreate.allowed
              ? () => router.push("/purchases/new")
              : undefined
          }
        />
      ) : null}

      {!isPending && result.items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton
                    label="PO #"
                    direction={sortDirectionFor("purchaseNumber")}
                    onToggle={() => toggleSort("purchaseNumber")}
                  />
                </TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>
                  <SortButton
                    label="Status"
                    direction={sortDirectionFor("status")}
                    onToggle={() => toggleSort("status")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Total"
                    direction={sortDirectionFor("grandTotal")}
                    onToggle={() => toggleSort("grandTotal")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Expected"
                    direction={sortDirectionFor("expectedDelivery")}
                    onToggle={() => toggleSort("expectedDelivery")}
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
              {result.items.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>
                    <Link
                      href={`/purchases/${purchase.id}`}
                      className="font-mono text-xs font-medium hover:underline"
                    >
                      {purchase.purchaseNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{purchase.vendorName ?? "—"}</TableCell>
                  <TableCell>
                    <DsBadge
                      variant={PURCHASE_STATUS_VARIANTS[purchase.status]}
                      size="sm"
                    >
                      {PURCHASE_STATUS_LABELS[purchase.status]}
                    </DsBadge>
                  </TableCell>
                  <TableCell>
                    {formatPurchaseMoney(purchase.grandTotal)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPurchaseDate(purchase.expectedDelivery)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPurchaseDate(purchase.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-xl"
                        aria-label={`View ${purchase.purchaseNumber}`}
                        onClick={() =>
                          router.push(`/purchases/${purchase.id}`)
                        }
                      >
                        <Eye className="size-4" />
                      </Button>
                      {canEdit.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-xl"
                          aria-label={`Edit ${purchase.purchaseNumber}`}
                          onClick={() =>
                            router.push(`/purchases/${purchase.id}/edit`)
                          }
                        >
                          <Pencil className="size-4" />
                        </Button>
                      ) : null}
                      {canDelete.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-xl text-destructive hover:text-destructive"
                          aria-label={`Delete ${purchase.purchaseNumber}`}
                          onClick={() => handleDelete(purchase)}
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
          {result.meta.total} purchase
          {result.meta.total === 1 ? "" : "s"}
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
