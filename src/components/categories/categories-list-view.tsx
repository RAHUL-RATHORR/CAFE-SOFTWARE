"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { CategoriesTable } from "@/components/categories/categories-table";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useHasPermission } from "@/hooks/rbac";
import { cn } from "@/lib/utils";
import type { CategoryListResult } from "@/types/category";

type CategoriesListViewProps = {
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

export function CategoriesListView({
  result,
  query,
  errorMessage,
}: CategoriesListViewProps) {
  const canCreate = useHasPermission("categories.create");

  return (
    <PageContainer
      title="Categories"
      description="Organize menu categories for your restaurant."
      actions={
        canCreate.allowed ? (
          <Link
            href="/categories/new"
            className={cn(buttonVariants(), "rounded-xl")}
          >
            New category
          </Link>
        ) : null
      }
    >
      <Suspense fallback={<TableLoadingSkeleton rows={6} columns={6} />}>
        <CategoriesTable
          result={result}
          query={query}
          errorMessage={errorMessage}
        />
      </Suspense>
    </PageContainer>
  );
}
