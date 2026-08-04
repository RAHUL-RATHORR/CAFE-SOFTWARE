"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { RestaurantTablesView } from "@/components/restaurant-tables/restaurant-tables-view";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useHasPermission } from "@/hooks/rbac";
import { cn } from "@/lib/utils";
import type { RestaurantTableListResult } from "@/types/restaurant-table";

type RestaurantTablesListViewProps = {
  result: RestaurantTableListResult;
  query: {
    q: string;
    status: string;
    floorId: string;
    minCapacity: string;
    maxCapacity: string;
    active: string;
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
    view: "table" | "cards";
  };
  errorMessage?: string | null;
};

export function RestaurantTablesListView({
  result,
  query,
  errorMessage,
}: RestaurantTablesListViewProps) {
  const canCreate = useHasPermission(["tables.create", "tables.manage"]);

  return (
    <PageContainer
      title="Tables"
      description="Configure floor tables and seating capacity."
      actions={
        canCreate.allowed ? (
          <Link
            href="/tables/new"
            className={cn(buttonVariants(), "rounded-xl")}
          >
            New table
          </Link>
        ) : null
      }
    >
      <Suspense fallback={<TableLoadingSkeleton rows={6} columns={7} />}>
        <RestaurantTablesView
          result={result}
          query={query}
          errorMessage={errorMessage}
        />
      </Suspense>
    </PageContainer>
  );
}
