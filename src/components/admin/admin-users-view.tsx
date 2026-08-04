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
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { updateAdminUser } from "@/actions/admin";
import { formatAdminDate } from "@/lib/admin";
import { toast } from "@/store/toast-store";
import type { AdminUserSummary } from "@/types/admin";
import type { PaginationMeta } from "@/types/database";

type AdminUsersViewProps = {
  items: AdminUserSummary[];
  meta: PaginationMeta;
  query: {
    q: string;
    status: string;
    role: string;
    page: number;
    pageSize: number;
  };
  errorMessage?: string | null;
};

export function AdminUsersView({
  items,
  meta,
  query,
  errorMessage,
}: AdminUsersViewProps) {
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

  function setUserStatus(user: AdminUserSummary, status: "active" | "suspended") {
    openConfirmDialog("publish", {
      title: `${status === "active" ? "Activate" : "Suspend"} ${user.name}?`,
      description: "Password reset is a placeholder — not implemented.",
      confirmLabel: "Confirm",
      onConfirm: async () => {
        const result = await updateAdminUser({ id: user.id, status });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("User updated", status);
        router.refresh();
      },
    });
  }

  return (
    <AdminShell
      title="Users"
      description="Global user directory, roles, and restaurant assignment."
    >
      <AppCard title="Platform users" contentClassName="space-y-4">
        <TableToolbar
          searchPlaceholder="Search name, email, phone…"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusOptions={[
            { label: "All statuses", value: "all" },
            { label: "Active", value: "active" },
            { label: "Suspended", value: "suspended" },
            { label: "Inactive", value: "inactive" },
            { label: "Invited", value: "invited" },
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

        {items.length === 0 ? (
          <TableEmptyState
            title="No users"
            description="Users across all tenants appear here."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>{user.restaurantName ?? "—"}</TableCell>
                    <TableCell>
                      <DsBadge
                        variant={
                          user.status === "active"
                            ? "success"
                            : user.status === "suspended"
                              ? "warning"
                              : "secondary"
                        }
                        size="sm"
                      >
                        {user.status}
                      </DsBadge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatAdminDate(user.lastLogin)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setUserStatus(user, "active")}
                        >
                          Activate
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setUserStatus(user, "suspended")}
                        >
                          Suspend
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-xl"
                          onClick={() =>
                            toast.info(
                              "Password reset",
                              "Placeholder — email delivery not connected."
                            )
                          }
                        >
                          Reset PW
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{meta.total} users</p>
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
