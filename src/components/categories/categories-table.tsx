"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Eye, Pencil, Power, Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
import { Button } from "@/components/ui/button";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { deleteCategory, toggleCategoryStatus } from "@/actions/categories";
import { formatCategoryDate } from "@/lib/categories";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { Category, CategoryListResult } from "@/types/category";
import type { SortDirection } from "@/types";

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

type CategoriesTableProps = {
  result: CategoryListResult;
  query: {
    q: string;
    status: string;
    createdFrom: string;
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  errorMessage?: string | null;
};

export function CategoriesTable({
  result,
  query,
  errorMessage,
}: CategoriesTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query.q);

  const canCreate = useHasPermission("categories.create");
  const canEdit = useHasPermission("categories.edit");
  const canDelete = useHasPermission("categories.delete");

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

  function handleDelete(category: Category) {
    openConfirmDialog("delete", {
      title: `Delete “${category.name}”?`,
      description:
        "This category will be soft-deleted and hidden from the list.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const deleteResult = await deleteCategory({ id: category.id });
        if (!deleteResult.success) {
          toast.error(deleteResult.error.message);
          return;
        }
        toast.success("Category deleted", category.name);
        router.refresh();
      },
    });
  }

  function handleToggle(category: Category) {
    startTransition(async () => {
      const toggleResult = await toggleCategoryStatus({ id: category.id });
      if (!toggleResult.success) {
        toast.error(toggleResult.error.message);
        return;
      }
      toast.success(
        toggleResult.data.isActive
          ? "Category activated"
          : "Category deactivated",
        toggleResult.data.name
      );
      router.refresh();
    });
  }

  return (
    <AppCard
      title="All categories"
      description="Search, filter, and manage menu categories"
      className="shadow-sm"
      contentClassName="space-y-4"
    >
      <TableToolbar
        searchPlaceholder="Search by name…"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusOptions={statusOptions}
        statusValue={query.status}
        onStatusChange={(value) => updateParams({ status: value })}
        dateValue={query.createdFrom}
        onDateChange={(value) => updateParams({ createdFrom: value })}
        onRefresh={() => router.refresh()}
        trailing={
          canCreate.allowed ? (
            <Link
              href="/categories/new"
              className={cn(buttonVariants({ size: "default" }), "rounded-xl")}
            >
              New category
            </Link>
          ) : null
        }
      />

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {isPending ? <TableLoadingSkeleton rows={5} columns={6} /> : null}

      {!isPending && result.items.length === 0 ? (
        <TableEmptyState
          title="No categories found"
          description="Create your first category or adjust search filters."
          actionLabel={canCreate.allowed ? "Create category" : undefined}
          onAction={
            canCreate.allowed
              ? () => router.push("/categories/new")
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
                    label="Name"
                    direction={sortDirectionFor("name")}
                    onToggle={() => toggleSort("name")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Slug"
                    direction={sortDirectionFor("slug")}
                    onToggle={() => toggleSort("slug")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Status"
                    direction={sortDirectionFor("isActive")}
                    onToggle={() => toggleSort("isActive")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Display order"
                    direction={sortDirectionFor("displayOrder")}
                    onToggle={() => toggleSort("displayOrder")}
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
              {result.items.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: category.color || "#2563EB",
                        }}
                        aria-hidden
                      />
                      <Link
                        href={`/categories/${category.id}`}
                        className="font-medium hover:underline"
                      >
                        {category.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {category.slug}
                  </TableCell>
                  <TableCell>
                    <DsBadge
                      variant={category.isActive ? "success" : "secondary"}
                      size="sm"
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </DsBadge>
                  </TableCell>
                  <TableCell>{category.displayOrder}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCategoryDate(category.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-xl"
                        aria-label={`View ${category.name}`}
                        onClick={() =>
                          router.push(`/categories/${category.id}`)
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
                          aria-label={`Edit ${category.name}`}
                          onClick={() =>
                            router.push(`/categories/${category.id}/edit`)
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
                          aria-label={
                            category.isActive
                              ? `Deactivate ${category.name}`
                              : `Activate ${category.name}`
                          }
                          onClick={() => handleToggle(category)}
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
                          aria-label={`Delete ${category.name}`}
                          onClick={() => handleDelete(category)}
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
          {result.meta.total} categor{result.meta.total === 1 ? "y" : "ies"}
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
