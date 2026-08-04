"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Eye, Pencil, Power, Star, Trash2, ImageIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import {
  deleteMenuItem,
  toggleAvailability,
  toggleFeatured,
} from "@/actions/menu-items";
import {
  formatMenuItemDate,
  formatMenuItemPrice,
} from "@/lib/menu-items";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type {
  CategoryOption,
  MenuItem,
  MenuItemListResult,
} from "@/types/menu-item";
import type { SortDirection } from "@/types";

const availabilityOptions = [
  { label: "All availability", value: "all" },
  { label: "Available", value: "available" },
  { label: "Unavailable", value: "unavailable" },
];

const vegOptions = [
  { label: "All diet", value: "all" },
  { label: "Veg", value: "veg" },
  { label: "Non-veg", value: "non-veg" },
];

const featuredOptions = [
  { label: "All featured", value: "all" },
  { label: "Featured", value: "featured" },
  { label: "Not featured", value: "not-featured" },
];

type MenuItemsTableProps = {
  result: MenuItemListResult;
  categoryOptions: CategoryOption[];
  query: {
    q: string;
    categoryId: string;
    availability: string;
    veg: string;
    featured: string;
    minPrice: string;
    maxPrice: string;
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  errorMessage?: string | null;
};

export function MenuItemsTable({
  result,
  categoryOptions,
  query,
  errorMessage,
}: MenuItemsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query.q);
  const [minPrice, setMinPrice] = useState(query.minPrice);
  const [maxPrice, setMaxPrice] = useState(query.maxPrice);

  const canCreate = useHasPermission(["menu-items.create", "menu-items.manage"]);
  const canEdit = useHasPermission(["menu-items.edit", "menu-items.manage"]);
  const canDelete = useHasPermission(["menu-items.delete", "menu-items.manage"]);

  const updateParams = useCallback(
    (patch: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (
          value === undefined ||
          value === "" ||
          value === "all"
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
    setMinPrice(query.minPrice);
    setMaxPrice(query.maxPrice);
  }, [query.q, query.minPrice, query.maxPrice]);

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

  function handleDelete(item: MenuItem) {
    openConfirmDialog("delete", {
      title: `Delete “${item.name}”?`,
      description: "This menu item will be soft-deleted and hidden from the list.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const deleteResult = await deleteMenuItem({ id: item.id });
        if (!deleteResult.success) {
          toast.error(deleteResult.error.message);
          return;
        }
        toast.success("Menu item deleted", item.name);
        router.refresh();
      },
    });
  }

  function handleToggleAvailability(item: MenuItem) {
    startTransition(async () => {
      const toggleResult = await toggleAvailability({ id: item.id });
      if (!toggleResult.success) {
        toast.error(toggleResult.error.message);
        return;
      }
      toast.success(
        toggleResult.data.isAvailable ? "Item available" : "Item unavailable",
        toggleResult.data.name
      );
      router.refresh();
    });
  }

  function handleToggleFeatured(item: MenuItem) {
    startTransition(async () => {
      const toggleResult = await toggleFeatured({ id: item.id });
      if (!toggleResult.success) {
        toast.error(toggleResult.error.message);
        return;
      }
      toast.success(
        toggleResult.data.isFeatured ? "Marked featured" : "Unmarked featured",
        toggleResult.data.name
      );
      router.refresh();
    });
  }

  const categoryFilterOptions = [
    { label: "All categories", value: "all" },
    ...categoryOptions.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  ];

  return (
    <AppCard
      title="All menu items"
      description="Search, filter, and manage dishes"
      className="shadow-sm"
      contentClassName="space-y-4"
    >
      <TableToolbar
        searchPlaceholder="Search name, SKU…"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusOptions={availabilityOptions}
        statusValue={query.availability}
        onStatusChange={(value) => updateParams({ availability: value })}
        categoryOptions={categoryFilterOptions}
        categoryValue={query.categoryId || "all"}
        onCategoryChange={(value) =>
          updateParams({ categoryId: value === "all" ? undefined : value })
        }
        onRefresh={() => router.refresh()}
        trailing={
          canCreate.allowed ? (
            <Link
              href="/menu-items/new"
              className={cn(buttonVariants({ size: "default" }), "rounded-xl")}
            >
              New item
            </Link>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Veg filter"
          options={vegOptions}
          value={query.veg}
          onChange={(value) => updateParams({ veg: value })}
        />
        <FilterDropdown
          label="Featured filter"
          options={featuredOptions}
          value={query.featured}
          onChange={(value) => updateParams({ featured: value })}
        />
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="Min price"
          aria-label="Minimum price"
          value={minPrice}
          className="h-9 w-28 rounded-xl"
          onChange={(event) => setMinPrice(event.target.value)}
          onBlur={() => updateParams({ minPrice })}
        />
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="Max price"
          aria-label="Maximum price"
          value={maxPrice}
          className="h-9 w-28 rounded-xl"
          onChange={(event) => setMaxPrice(event.target.value)}
          onBlur={() => updateParams({ maxPrice })}
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
          title="No menu items found"
          description="Create your first dish or adjust search filters."
          actionLabel={canCreate.allowed ? "Create item" : undefined}
          onAction={
            canCreate.allowed
              ? () => router.push("/menu-items/new")
              : undefined
          }
        />
      ) : null}

      {!isPending && result.items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Image</TableHead>
                <TableHead>
                  <SortButton
                    label="Name"
                    direction={sortDirectionFor("name")}
                    onToggle={() => toggleSort("name")}
                  />
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead>
                  <SortButton
                    label="Price"
                    direction={sortDirectionFor("price")}
                    onToggle={() => toggleSort("price")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Availability"
                    direction={sortDirectionFor("isAvailable")}
                    onToggle={() => toggleSort("isAvailable")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Featured"
                    direction={sortDirectionFor("isFeatured")}
                    onToggle={() => toggleSort("isFeatured")}
                  />
                </TableHead>
                <TableHead>Status</TableHead>
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
              {result.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <ItemThumb name={item.name} image={item.image} />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <Link
                        href={`/menu-items/${item.id}`}
                        className="font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      {item.sku ? (
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {item.sku}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.categoryName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {item.discountPrice != null ? (
                        <>
                          <p className="font-medium">
                            {formatMenuItemPrice(item.discountPrice)}
                          </p>
                          <p className="text-xs text-muted-foreground line-through">
                            {formatMenuItemPrice(item.price)}
                          </p>
                        </>
                      ) : (
                        <p className="font-medium">
                          {formatMenuItemPrice(item.price)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DsBadge
                      variant={item.isAvailable ? "success" : "secondary"}
                      size="sm"
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </DsBadge>
                  </TableCell>
                  <TableCell>
                    <DsBadge
                      variant={item.isFeatured ? "warning" : "ghost"}
                      size="sm"
                    >
                      {item.isFeatured ? "Featured" : "—"}
                    </DsBadge>
                  </TableCell>
                  <TableCell>
                    <DsBadge
                      variant={item.isVeg ? "success" : "danger"}
                      size="sm"
                    >
                      {item.isVeg ? "Veg" : "Non-veg"}
                    </DsBadge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatMenuItemDate(item.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-xl"
                        aria-label={`View ${item.name}`}
                        onClick={() => router.push(`/menu-items/${item.id}`)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {canEdit.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-xl"
                          aria-label={`Edit ${item.name}`}
                          onClick={() =>
                            router.push(`/menu-items/${item.id}/edit`)
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
                          aria-label={`Toggle availability for ${item.name}`}
                          onClick={() => handleToggleAvailability(item)}
                        >
                          <Power className="size-4" />
                        </Button>
                      ) : null}
                      {canEdit.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-xl"
                          aria-label={`Toggle featured for ${item.name}`}
                          onClick={() => handleToggleFeatured(item)}
                        >
                          <Star className="size-4" />
                        </Button>
                      ) : null}
                      {canDelete.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-xl text-destructive hover:text-destructive"
                          aria-label={`Delete ${item.name}`}
                          onClick={() => handleDelete(item)}
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
          {result.meta.total} item{result.meta.total === 1 ? "" : "s"}
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

function ItemThumb({ name, image }: { name: string; image: string }) {
  if (image && image.startsWith("http")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className="size-10 rounded-xl object-cover"
      />
    );
  }
  return (
    <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
      <ImageIcon className="size-4" aria-hidden />
    </span>
  );
}
