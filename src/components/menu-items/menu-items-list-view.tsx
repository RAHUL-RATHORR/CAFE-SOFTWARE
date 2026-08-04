"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { MenuItemsTable } from "@/components/menu-items/menu-items-table";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useHasPermission } from "@/hooks/rbac";
import { cn } from "@/lib/utils";
import type {
  CategoryOption,
  MenuItemListResult,
} from "@/types/menu-item";

type MenuItemsListViewProps = {
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

export function MenuItemsListView({
  result,
  categoryOptions,
  query,
  errorMessage,
}: MenuItemsListViewProps) {
  const canCreate = useHasPermission([
    "menu-items.create",
    "menu-items.manage",
  ]);

  return (
    <PageContainer
      title="Menu Items"
      description="Manage dishes, prices, and availability."
      actions={
        canCreate.allowed ? (
          <Link
            href="/menu-items/new"
            className={cn(buttonVariants(), "rounded-xl")}
          >
            New item
          </Link>
        ) : null
      }
    >
      <Suspense fallback={<TableLoadingSkeleton rows={6} columns={8} />}>
        <MenuItemsTable
          result={result}
          categoryOptions={categoryOptions}
          query={query}
          errorMessage={errorMessage}
        />
      </Suspense>
    </PageContainer>
  );
}
