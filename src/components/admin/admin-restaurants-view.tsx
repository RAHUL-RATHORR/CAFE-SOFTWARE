"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AppCard } from "@/components/cards/app-card";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { Pagination } from "@/components/tables/pagination";
import { PageSizeSelector } from "@/components/tables/page-size-selector";
import { TableEmptyState } from "@/components/tables/table-empty-state";
import { DsBadge } from "@/components/badges/ds-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { updateTenantStatus } from "@/actions/admin";
import {
  TENANT_PLATFORM_STATUS_LABELS,
  TENANT_PLATFORM_STATUS_VARIANTS,
} from "@/config/admin";
import { formatAdminDate } from "@/lib/admin";
import { toast } from "@/store/toast-store";
import type { AdminTenantSummary } from "@/types/admin";
import type { PaginationMeta } from "@/types/database";

type AdminRestaurantsViewProps = {
  items: AdminTenantSummary[];
  meta: PaginationMeta;
  query: {
    q: string;
    status: string;
    page: number;
    pageSize: number;
  };
  errorMessage?: string | null;
};

export function AdminRestaurantsView({
  items,
  meta,
  query,
  errorMessage,
}: AdminRestaurantsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(query.q);
  const [isPending, startTransition] = useTransition();

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
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
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

  function setStatus(tenant: AdminTenantSummary, status: "active" | "suspended" | "inactive") {
    openConfirmDialog("publish", {
      title: `Set “${tenant.name}” to ${status}?`,
      description: "This updates platform status and restaurant isActive.",
      confirmLabel: "Confirm",
      onConfirm: async () => {
        const result = await updateTenantStatus({
          restaurantId: tenant.id,
          status,
        });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Restaurant updated", status);
        router.refresh();
      },
    });
  }

  return (
    <AdminShell
      title="Restaurants"
      description="Tenant directory, lifecycle, and usage summary."
    >
      <AppCard title="Restaurant list" contentClassName="space-y-4">
        <TableToolbar
          searchPlaceholder="Search name, slug, email…"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusOptions={[
            { label: "All statuses", value: "all" },
            { label: "Active", value: "active" },
            { label: "Suspended", value: "suspended" },
            { label: "Inactive", value: "inactive" },
          ]}
          statusValue={query.status}
          onStatusChange={(value) => updateParams({ status: value })}
          onRefresh={() => router.refresh()}
        />

        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {!isPending && items.length === 0 ? (
          <TableEmptyState
            title="No restaurants"
            description="Tenant restaurants will appear here."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tenant.email} · {tenant.city}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {tenant.ownerName ?? "—"}
                      <p className="text-xs text-muted-foreground">
                        {tenant.ownerEmail ?? ""}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {tenant.saasPlanName ?? tenant.subscriptionPlan}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tenant.saasStatus ?? tenant.subscriptionStatus}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {tenant.branchCount} branches · {tenant.userCount} users ·{" "}
                      {tenant.orderCount} orders
                    </TableCell>
                    <TableCell>
                      <DsBadge
                        variant={
                          TENANT_PLATFORM_STATUS_VARIANTS[tenant.platformStatus]
                        }
                        size="sm"
                      >
                        {TENANT_PLATFORM_STATUS_LABELS[tenant.platformStatus]}
                      </DsBadge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatAdminDate(tenant.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setStatus(tenant, "active")}
                        >
                          Activate
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setStatus(tenant, "suspended")}
                        >
                          Suspend
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-xl"
                          onClick={() => setStatus(tenant, "inactive")}
                        >
                          Deactivate
                        </Button>
                        <Link
                          href={`/admin/subscriptions?restaurantId=${tenant.id}`}
                          className="inline-flex h-8 items-center rounded-xl px-2 text-xs text-primary hover:underline"
                        >
                          Subscription
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
          <p className="text-sm text-muted-foreground">{meta.total} restaurants</p>
          <div className="flex flex-wrap items-center gap-3">
            <PageSizeSelector
              value={query.pageSize}
              onChange={(value) => updateParams({ pageSize: value, page: 1 })}
            />
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={(page) => updateParams({ page })}
            />
          </div>
        </div>
      </AppCard>
    </AdminShell>
  );
}
