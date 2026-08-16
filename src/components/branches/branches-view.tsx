"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Eye, Pencil, Power, Star, Table2 } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { Pagination } from "@/components/tables/pagination";
import { PageSizeSelector } from "@/components/tables/page-size-selector";
import { SortButton } from "@/components/tables/sort-button";
import { TableEmptyState } from "@/components/tables/table-empty-state";
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
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import {
  deactivateBranch,
  activateBranch,
  setDefaultBranch,
} from "@/actions/branches";
import { BRANCH_STATUS_LABELS } from "@/config/branches";
import { formatBranchDate } from "@/lib/branches";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Branch, BranchListResult, BranchStatus } from "@/types/branch";
import type { SortDirection } from "@/types";

const statusFilterOptions = [
  { label: "All statuses", value: "all" },
  ...Object.entries(BRANCH_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const activeFilterOptions = [
  { label: "All", value: "all" },
  { label: "Active only", value: "active" },
  { label: "Inactive only", value: "inactive" },
];

const statusVariant: Record<
  BranchStatus,
  "success" | "warning" | "info" | "secondary" | "danger"
> = {
  active: "success",
  inactive: "danger",
  "coming-soon": "info",
  "temporarily-closed": "warning",
};

type BranchesViewProps = {
  result: BranchListResult;
  query: {
    q: string;
    status: string;
    active: string;
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  errorMessage?: string | null;
};

export function BranchesView({
  result,
  query,
  errorMessage,
}: BranchesViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query.q);

  const canEdit = useHasPermission(["branches.edit", "branches.manage"]);
  const canCreate = useHasPermission(["branches.create", "branches.manage"]);

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
    updateParams({ sortBy: field, sortOrder: nextOrder });
  }

  function handleToggleStatus(branch: Branch) {
    const nextActive = branch.status !== "active";
    openConfirmDialog(nextActive ? "publish" : "deactivate", {
      title: nextActive
        ? `Activate “${branch.name}”?`
        : `Deactivate “${branch.name}”?`,
      description: nextActive
        ? "Guests will be able to place QR orders at this branch again."
        : "Existing data is kept. New QR and order entry for this branch will be blocked.",
      confirmLabel: nextActive ? "Activate" : "Deactivate",
      onConfirm: async () => {
        const actionResult = nextActive
          ? await activateBranch({ id: branch.id })
          : await deactivateBranch({ id: branch.id });
        if (!actionResult.success) {
          toast.error(actionResult.error.message);
          return;
        }
        toast.success(
          nextActive ? "Branch activated" : "Branch deactivated",
          actionResult.data.name
        );
        router.refresh();
      },
    });
  }

  function handleSetDefault(branch: Branch) {
    if (branch.isMainBranch) return;
    openConfirmDialog("custom", {
      title: `Set “${branch.name}” as default?`,
      description: "Only one branch can be the default for this restaurant.",
      confirmLabel: "Set default",
      onConfirm: async () => {
        const actionResult = await setDefaultBranch({ id: branch.id });
        if (!actionResult.success) {
          toast.error(actionResult.error.message);
          return;
        }
        toast.success("Default branch updated", actionResult.data.name);
        router.refresh();
      },
    });
  }

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <AppCard className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </AppCard>
      ) : null}

      <TableToolbar
        searchPlaceholder="Search branches…"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusOptions={statusFilterOptions}
        statusValue={query.status}
        onStatusChange={(value) => updateParams({ status: value })}
        onRefresh={() => router.refresh()}
        trailing={
          <>
            <FilterDropdown
              label="Active"
              value={query.active}
              options={activeFilterOptions}
              onChange={(value) => updateParams({ active: value })}
            />
            {canCreate.allowed ? (
              <Link
                href="/branches/new"
                className={cn(buttonVariants({ size: "sm" }), "rounded-xl")}
              >
                New branch
              </Link>
            ) : null}
          </>
        }
      />

      {result.items.length === 0 ? (
        <TableEmptyState
          title="No branches yet"
          description="Create your first outlet to manage tables and QR codes by location."
          actionLabel={canCreate.allowed ? "Create branch" : undefined}
          onAction={
            canCreate.allowed
              ? () => {
                  router.push("/branches/new");
                }
              : undefined
          }
        />
      ) : (
        <AppCard className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton
                    label="Name"
                    direction={sortDirectionFor("name")}
                    onToggle={() => toggleSort("name")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Code"
                    direction={sortDirectionFor("branchCode")}
                    onToggle={() => toggleSort("branchCode")}
                  />
                </TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Tables</TableHead>
                <TableHead>
                  <SortButton
                    label="Status"
                    direction={sortDirectionFor("status")}
                    onToggle={() => toggleSort("status")}
                  />
                </TableHead>
                <TableHead>Default</TableHead>
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
              {result.items.map((branch) => (
                <TableRow
                  key={branch.id}
                  className={cn(isPending && "opacity-70")}
                >
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>{branch.branchCode}</TableCell>
                  <TableCell>
                    {branch.city}, {branch.state}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{branch.phone}</div>
                    <div>{branch.email}</div>
                  </TableCell>
                  <TableCell>{branch.tableCount ?? 0}</TableCell>
                  <TableCell>
                    <DsBadge variant={statusVariant[branch.status]} size="sm">
                      {BRANCH_STATUS_LABELS[branch.status]}
                    </DsBadge>
                  </TableCell>
                  <TableCell>
                    {branch.isMainBranch ? (
                      <DsBadge variant="info" size="sm">
                        Default
                      </DsBadge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{formatBranchDate(branch.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-xl"
                        aria-label={`View ${branch.name}`}
                        onClick={() => router.push(`/branches/${branch.id}`)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-xl"
                        aria-label={`Tables for ${branch.name}`}
                        onClick={() =>
                          router.push(`/branches/${branch.id}/tables`)
                        }
                      >
                        <Table2 className="size-4" />
                      </Button>
                      {canEdit.allowed ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-xl"
                            aria-label={`Edit ${branch.name}`}
                            onClick={() =>
                              router.push(`/branches/${branch.id}/edit`)
                            }
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-xl"
                            aria-label={
                              branch.status === "active"
                                ? `Deactivate ${branch.name}`
                                : `Activate ${branch.name}`
                            }
                            onClick={() => handleToggleStatus(branch)}
                          >
                            <Power className="size-4" />
                          </Button>
                          {!branch.isMainBranch ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-xl"
                              aria-label={`Set ${branch.name} as default`}
                              onClick={() => handleSetDefault(branch)}
                            >
                              <Star className="size-4" />
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AppCard>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
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
    </div>
  );
}
