"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Eye, FileText, Plus } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { StatCard } from "@/components/cards/stat-card";
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
import { buttonVariants } from "@/components/ui/button";
import {
  BILL_PAYMENT_METHOD_LABELS,
  BILL_PAYMENT_STATUS_LABELS,
  BILL_PAYMENT_STATUS_VARIANTS,
} from "@/config/billing";
import { formatBillingDate, formatBillingMoney } from "@/lib/billing";
import { useHasPermission } from "@/hooks/rbac";
import { cn } from "@/lib/utils";
import type { BillListResult, BillingSummary } from "@/types/billing";
import {
  BILL_PAYMENT_METHODS,
  BILL_PAYMENT_STATUSES,
} from "@/types/billing";
import type { SortDirection } from "@/types";

type BillsListViewProps = {
  result: BillListResult;
  summary: BillingSummary | null;
  query: {
    q: string;
    paymentStatus: string;
    paymentMethod: string;
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  errorMessage?: string | null;
};

const statusOptions = [
  { label: "All statuses", value: "all" },
  ...BILL_PAYMENT_STATUSES.map((value) => ({
    value,
    label: BILL_PAYMENT_STATUS_LABELS[value],
  })),
];

const methodOptions = [
  { label: "All methods", value: "all" },
  ...BILL_PAYMENT_METHODS.map((value) => ({
    value,
    label: BILL_PAYMENT_METHOD_LABELS[value],
  })),
];

export function BillsListView({
  result,
  summary,
  query,
  errorMessage,
}: BillsListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query.q);
  const canCreate = useHasPermission(["billing.create", "billing.manage"]);

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

  useEffect(() => setSearchValue(query.q), [query.q]);
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

  return (
    <div className="space-y-4">
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Bills today"
            value={String(summary.dailySales.billsCount)}
            description="Created today"
            accent="primary"
          />
          <StatCard
            title="Gross sales"
            value={formatBillingMoney(summary.dailySales.grossTotal)}
            description="Today"
            accent="success"
          />
          <StatCard
            title="Collected"
            value={formatBillingMoney(summary.dailySales.netCollected)}
            description="Payments received"
            accent="success"
          />
          <StatCard
            title="Refunds"
            value={formatBillingMoney(summary.refundSummary.amount)}
            description={`${summary.refundSummary.count} refunds`}
            accent="danger"
          />
        </div>
      ) : null}

      <AppCard
        title="Bills"
        description="Invoices, payments, and receipts"
        className="shadow-sm"
        contentClassName="space-y-4"
        action={
          canCreate.allowed ? (
            <Link
              href="/billing/new"
              className={cn(buttonVariants(), "rounded-xl")}
            >
              <Plus className="size-4" />
              Open POS
            </Link>
          ) : null
        }
      >
        <TableToolbar
          searchPlaceholder="Search invoice or item…"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusOptions={statusOptions}
          statusValue={query.paymentStatus}
          onStatusChange={(value) => updateParams({ paymentStatus: value })}
          onRefresh={() => router.refresh()}
        />

        <FilterDropdown
          label="Payment method"
          options={methodOptions}
          value={query.paymentMethod || "all"}
          onChange={(value) =>
            updateParams({
              paymentMethod: value === "all" ? undefined : value,
            })
          }
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
          <TableLoadingSkeleton rows={6} columns={6} />
        ) : result.items.length === 0 ? (
          <TableEmptyState
            title="No bills yet"
            description="Open the POS to create your first bill."
            actionLabel={canCreate.allowed ? "Open POS" : undefined}
            onAction={
              canCreate.allowed
                ? () => router.push("/billing/new")
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton
                      label="Invoice"
                      direction={sortDirectionFor("invoiceNumber")}
                      onToggle={() => toggleSort("invoiceNumber")}
                    />
                  </TableHead>
                  <TableHead>
                    <SortButton
                      label="Status"
                      direction={sortDirectionFor("paymentStatus")}
                      onToggle={() => toggleSort("paymentStatus")}
                    />
                  </TableHead>
                  <TableHead>Method</TableHead>
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
                {result.items.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/billing/${bill.id}`}
                        className="hover:underline"
                      >
                        {bill.invoiceNumber}
                      </Link>
                      {bill.orderNumber ? (
                        <p className="text-xs text-muted-foreground">
                          Order {bill.orderNumber}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <DsBadge
                        variant={
                          BILL_PAYMENT_STATUS_VARIANTS[bill.paymentStatus]
                        }
                      >
                        {BILL_PAYMENT_STATUS_LABELS[bill.paymentStatus]}
                      </DsBadge>
                    </TableCell>
                    <TableCell>
                      {BILL_PAYMENT_METHOD_LABELS[bill.paymentMethod]}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatBillingMoney(bill.grandTotal)}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatBillingDate(bill.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/billing/${bill.id}`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "size-8"
                          )}
                          aria-label={`View ${bill.invoiceNumber}`}
                        >
                          <Eye className="size-4" />
                        </Link>
                        <Link
                          href={`/billing/${bill.id}/invoice`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "size-8"
                          )}
                          aria-label={`Invoice ${bill.invoiceNumber}`}
                        >
                          <FileText className="size-4" />
                        </Link>
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
    </div>
  );
}
