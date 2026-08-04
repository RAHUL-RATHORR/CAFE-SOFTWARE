"use client";

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
import { AUDIT_CATEGORY_LABELS } from "@/config/admin";
import { formatAdminDate } from "@/lib/admin";
import { toast } from "@/store/toast-store";
import type { AdminAuditLog } from "@/types/admin";
import type { PaginationMeta } from "@/types/database";

type AdminAuditViewProps = {
  items: AdminAuditLog[];
  meta: PaginationMeta;
  query: {
    q: string;
    category: string;
    page: number;
    pageSize: number;
  };
  errorMessage?: string | null;
};

export function AdminAuditView({
  items,
  meta,
  query,
  errorMessage,
}: AdminAuditViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(query.q);
  const [, startTransition] = useTransition();

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

  return (
    <AdminShell
      title="Audit logs"
      description="Login, subscription, restaurant, user, role, and system events."
      actions={
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() =>
            toast.info("Export", "Audit export placeholder — not connected.")
          }
        >
          Export
        </Button>
      }
    >
      <AppCard title="Event stream" contentClassName="space-y-4">
        <TableToolbar
          searchPlaceholder="Search message, action, actor…"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusOptions={[
            { label: "All categories", value: "all" },
            ...Object.entries(AUDIT_CATEGORY_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          statusValue={query.category}
          onStatusChange={(value) => updateParams({ category: value })}
          onRefresh={() => router.refresh()}
        />

        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {items.length === 0 ? (
          <TableEmptyState
            title="No audit events"
            description="Admin actions will write audit records here."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Actor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">
                      {formatAdminDate(item.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DsBadge variant="secondary" size="sm">
                        {AUDIT_CATEGORY_LABELS[item.category]}
                      </DsBadge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.action}
                    </TableCell>
                    <TableCell>{item.message}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.actorEmail || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{meta.total} events</p>
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
