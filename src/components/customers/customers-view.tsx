"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Download,
  Eye,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
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
import { deleteCustomer } from "@/actions/customers";
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_VARIANTS,
  CUSTOMER_TAG_SUGGESTIONS,
} from "@/config/customers";
import {
  formatCustomerDate,
  formatCustomerMoney,
} from "@/lib/customers";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { CustomersListQuery } from "@/components/customers/customers-list-view";
import type { Customer, CustomerListResult } from "@/types/customer";
import type { SortDirection } from "@/types";

const statusFilterOptions = [
  { label: "All statuses", value: "all" },
  ...Object.entries(CUSTOMER_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const vipFilterOptions = [
  { label: "All guests", value: "false" },
  { label: "VIP only", value: "true" },
];

const tagFilterOptions = [
  { label: "All tags", value: "all" },
  ...CUSTOMER_TAG_SUGGESTIONS.map((tag) => ({
    value: tag,
    label: tag,
  })),
];

type CustomersViewProps = {
  result: CustomerListResult;
  query: CustomersListQuery;
  errorMessage?: string | null;
};

export function CustomersView({
  result,
  query,
  errorMessage,
}: CustomersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query.q);
  const [minOrders, setMinOrders] = useState(query.minOrders);
  const [maxOrders, setMaxOrders] = useState(query.maxOrders);
  const [minSpent, setMinSpent] = useState(query.minSpent);
  const [maxSpent, setMaxSpent] = useState(query.maxSpent);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const canCreate = useHasPermission([
    "customers.create",
    "customers.manage",
  ]);
  const canEdit = useHasPermission(["customers.edit", "customers.manage"]);
  const canDelete = useHasPermission([
    "customers.delete",
    "customers.manage",
  ]);
  const canExport = useHasPermission([
    "customers.export",
    "customers.manage",
  ]);

  const updateParams = useCallback(
    (patch: Record<string, string | number | boolean | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (
          value === undefined ||
          value === "" ||
          value === "all" ||
          value === false
        ) {
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
    setMinOrders(query.minOrders);
    setMaxOrders(query.maxOrders);
    setMinSpent(query.minSpent);
    setMaxSpent(query.maxSpent);
    setSelectedIds([]);
  }, [
    query.q,
    query.minOrders,
    query.maxOrders,
    query.minSpent,
    query.maxSpent,
    result.items,
  ]);

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

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === result.items.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(result.items.map((item) => item.id));
  }

  function handleDelete(customer: Customer) {
    openConfirmDialog("delete", {
      title: `Delete “${customer.fullName}”?`,
      description: "This customer will be soft-deleted and hidden from the list.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const deleteResult = await deleteCustomer({ id: customer.id });
        if (!deleteResult.success) {
          toast.error(deleteResult.error.message);
          return;
        }
        toast.success("Customer deleted", customer.fullName);
        router.refresh();
      },
    });
  }

  function handleExportPlaceholder() {
    toast.info(
      "Export coming soon",
      "Customer export is reserved for a later release."
    );
  }

  return (
    <AppCard
      title="Customer directory"
      description="Search, filter, and manage guest profiles"
      className="shadow-sm"
      contentClassName="space-y-4"
      action={
        canExport.allowed ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={handleExportPlaceholder}
          >
            <Download className="size-3.5" />
            Export
          </Button>
        ) : null
      }
    >
      <TableToolbar
        searchPlaceholder="Search name, phone, email, code, tags…"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusOptions={statusFilterOptions}
        statusValue={query.status}
        onStatusChange={(value) => updateParams({ status: value })}
        onRefresh={() => router.refresh()}
        trailing={
          canCreate.allowed ? (
            <Link
              href="/customers/new"
              className={cn(buttonVariants({ size: "default" }), "rounded-xl")}
            >
              New customer
            </Link>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Tag filter"
          options={tagFilterOptions}
          value={query.tag || "all"}
          onChange={(value) =>
            updateParams({ tag: value === "all" ? undefined : value })
          }
        />
        <FilterDropdown
          label="VIP filter"
          options={vipFilterOptions}
          value={query.vipOnly ? "true" : "false"}
          onChange={(value) =>
            updateParams({ vipOnly: value === "true" ? true : undefined })
          }
        />
        <Input
          type="number"
          min={0}
          placeholder="Min orders"
          aria-label="Minimum orders"
          value={minOrders}
          className="h-9 w-28 rounded-xl"
          onChange={(event) => setMinOrders(event.target.value)}
          onBlur={() => updateParams({ minOrders })}
        />
        <Input
          type="number"
          min={0}
          placeholder="Max orders"
          aria-label="Maximum orders"
          value={maxOrders}
          className="h-9 w-28 rounded-xl"
          onChange={(event) => setMaxOrders(event.target.value)}
          onBlur={() => updateParams({ maxOrders })}
        />
        <Input
          type="number"
          min={0}
          placeholder="Min spent"
          aria-label="Minimum spent"
          value={minSpent}
          className="h-9 w-28 rounded-xl"
          onChange={(event) => setMinSpent(event.target.value)}
          onBlur={() => updateParams({ minSpent })}
        />
        <Input
          type="number"
          min={0}
          placeholder="Max spent"
          aria-label="Maximum spent"
          value={maxSpent}
          className="h-9 w-28 rounded-xl"
          onChange={(event) => setMaxSpent(event.target.value)}
          onBlur={() => updateParams({ maxSpent })}
        />
        <Input
          type="date"
          aria-label="Last visit from"
          value={query.lastVisitFrom}
          className="h-9 w-36 rounded-xl"
          onChange={(event) =>
            updateParams({ lastVisitFrom: event.target.value })
          }
        />
        <Input
          type="date"
          aria-label="Last visit to"
          value={query.lastVisitTo}
          className="h-9 w-36 rounded-xl"
          onChange={(event) =>
            updateParams({ lastVisitTo: event.target.value })
          }
        />
        <Input
          type="date"
          aria-label="Created from"
          value={query.dateFrom}
          className="h-9 w-36 rounded-xl"
          onChange={(event) => updateParams({ dateFrom: event.target.value })}
        />
        <Input
          type="date"
          aria-label="Created to"
          value={query.dateTo}
          className="h-9 w-36 rounded-xl"
          onChange={(event) => updateParams({ dateTo: event.target.value })}
        />
      </div>

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          <Users className="size-4" aria-hidden />
          {selectedIds.length} selected — bulk actions coming soon
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {isPending ? <TableLoadingSkeleton rows={5} columns={8} /> : null}

      {!isPending && result.items.length === 0 ? (
        <TableEmptyState
          title="No customers found"
          description="Create your first guest profile or adjust search filters."
          actionLabel={canCreate.allowed ? "Create customer" : undefined}
          onAction={
            canCreate.allowed
              ? () => router.push("/customers/new")
              : undefined
          }
        />
      ) : null}

      {!isPending && result.items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border"
                    checked={
                      result.items.length > 0 &&
                      selectedIds.length === result.items.length
                    }
                    onChange={toggleSelectAll}
                    aria-label="Select all customers"
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Name"
                    direction={sortDirectionFor("fullName")}
                    onToggle={() => toggleSort("fullName")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Code"
                    direction={sortDirectionFor("customerCode")}
                    onToggle={() => toggleSort("customerCode")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Phone"
                    direction={sortDirectionFor("phone")}
                    onToggle={() => toggleSort("phone")}
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
                    label="Orders"
                    direction={sortDirectionFor("totalOrders")}
                    onToggle={() => toggleSort("totalOrders")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Spent"
                    direction={sortDirectionFor("totalSpent")}
                    onToggle={() => toggleSort("totalSpent")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Last visit"
                    direction={sortDirectionFor("lastVisit")}
                    onToggle={() => toggleSort("lastVisit")}
                  />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border"
                      checked={selectedIds.includes(customer.id)}
                      onChange={() => toggleSelect(customer.id)}
                      aria-label={`Select ${customer.fullName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-medium hover:underline"
                    >
                      {customer.fullName}
                    </Link>
                    {customer.tags.length > 0 ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {customer.tags.slice(0, 3).join(", ")}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {customer.customerCode}
                  </TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    <DsBadge
                      variant={CUSTOMER_STATUS_VARIANTS[customer.status]}
                      size="sm"
                    >
                      {CUSTOMER_STATUS_LABELS[customer.status]}
                    </DsBadge>
                  </TableCell>
                  <TableCell>{customer.totalOrders}</TableCell>
                  <TableCell>
                    {formatCustomerMoney(customer.totalSpent)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCustomerDate(customer.lastVisit)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-xl"
                        aria-label={`View ${customer.fullName}`}
                        onClick={() =>
                          router.push(`/customers/${customer.id}`)
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
                          aria-label={`Edit ${customer.fullName}`}
                          onClick={() =>
                            router.push(`/customers/${customer.id}/edit`)
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
                          aria-label={`Delete ${customer.fullName}`}
                          onClick={() => handleDelete(customer)}
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
          {result.meta.total} customer
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
