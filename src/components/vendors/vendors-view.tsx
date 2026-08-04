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
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { deleteVendor } from "@/actions/vendors";
import {
  VENDOR_STATUS_LABELS,
  VENDOR_STATUS_VARIANTS,
} from "@/config/vendors";
import { formatVendorDate } from "@/lib/vendors";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { VendorsListQuery } from "@/components/vendors/vendors-list-view";
import type { Vendor, VendorListResult } from "@/types/vendor";
import type { SortDirection } from "@/types";

const statusFilterOptions = [
  { label: "All statuses", value: "all" },
  ...Object.entries(VENDOR_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

type VendorsViewProps = {
  result: VendorListResult;
  query: VendorsListQuery;
  errorMessage?: string | null;
};

export function VendorsView({
  result,
  query,
  errorMessage,
}: VendorsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query.q);

  const canCreate = useHasPermission(["vendors.create"]);
  const canEdit = useHasPermission(["vendors.edit"]);
  const canDelete = useHasPermission(["vendors.delete"]);

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

  function handleDelete(vendor: Vendor) {
    openConfirmDialog("delete", {
      title: `Delete “${vendor.companyName}”?`,
      description: "This vendor will be soft-deleted and hidden from the list.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const deleteResult = await deleteVendor({ id: vendor.id });
        if (!deleteResult.success) {
          toast.error(deleteResult.error.message);
          return;
        }
        toast.success("Vendor deleted", vendor.companyName);
        router.refresh();
      },
    });
  }

  return (
    <AppCard
      title="Vendor directory"
      description="Search and manage suppliers"
      className="shadow-sm"
      contentClassName="space-y-4"
    >
      <TableToolbar
        searchPlaceholder="Search company, phone, email, code…"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusOptions={statusFilterOptions}
        statusValue={query.status}
        onStatusChange={(value) => updateParams({ status: value })}
        onRefresh={() => router.refresh()}
        trailing={
          canCreate.allowed ? (
            <Link
              href="/vendors/new"
              className={cn(buttonVariants(), "rounded-xl")}
            >
              New vendor
            </Link>
          ) : null
        }
      />

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {isPending ? <TableLoadingSkeleton rows={5} columns={7} /> : null}

      {!isPending && result.items.length === 0 ? (
        <TableEmptyState
          title="No vendors found"
          description="Create your first supplier or adjust search filters."
          actionLabel={canCreate.allowed ? "Create vendor" : undefined}
          onAction={
            canCreate.allowed ? () => router.push("/vendors/new") : undefined
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
                    label="Company"
                    direction={sortDirectionFor("companyName")}
                    onToggle={() => toggleSort("companyName")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Code"
                    direction={sortDirectionFor("vendorCode")}
                    onToggle={() => toggleSort("vendorCode")}
                  />
                </TableHead>
                <TableHead>Contact</TableHead>
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
                    label="Rating"
                    direction={sortDirectionFor("rating")}
                    onToggle={() => toggleSort("rating")}
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
              {result.items.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <Link
                      href={`/vendors/${vendor.id}`}
                      className="font-medium hover:underline"
                    >
                      {vendor.companyName}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {vendor.vendorCode}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {vendor.contactPerson || "—"}
                  </TableCell>
                  <TableCell>{vendor.phone}</TableCell>
                  <TableCell>
                    <DsBadge
                      variant={VENDOR_STATUS_VARIANTS[vendor.status]}
                      size="sm"
                    >
                      {VENDOR_STATUS_LABELS[vendor.status]}
                    </DsBadge>
                  </TableCell>
                  <TableCell>{vendor.rating.toFixed(1)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatVendorDate(vendor.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-xl"
                        aria-label={`View ${vendor.companyName}`}
                        onClick={() => router.push(`/vendors/${vendor.id}`)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {canEdit.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-xl"
                          aria-label={`Edit ${vendor.companyName}`}
                          onClick={() =>
                            router.push(`/vendors/${vendor.id}/edit`)
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
                          aria-label={`Delete ${vendor.companyName}`}
                          onClick={() => handleDelete(vendor)}
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
          {result.meta.total} vendor{result.meta.total === 1 ? "" : "s"}
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
