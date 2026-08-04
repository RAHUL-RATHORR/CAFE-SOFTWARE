"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { VendorsView } from "@/components/vendors/vendors-view";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useHasPermission } from "@/hooks/rbac";
import { cn } from "@/lib/utils";
import type { VendorListResult } from "@/types/vendor";

export type VendorsListQuery = {
  q: string;
  status: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

type VendorsListViewProps = {
  result: VendorListResult;
  query: VendorsListQuery;
  errorMessage?: string | null;
};

export function VendorsListView({
  result,
  query,
  errorMessage,
}: VendorsListViewProps) {
  const canCreate = useHasPermission(["vendors.create"]);

  return (
    <PageContainer
      title="Vendors"
      description="Manage suppliers and purchase partners."
      actions={
        canCreate.allowed ? (
          <Link
            href="/vendors/new"
            className={cn(buttonVariants(), "rounded-xl")}
          >
            New vendor
          </Link>
        ) : null
      }
    >
      <Suspense fallback={<TableLoadingSkeleton rows={6} columns={7} />}>
        <VendorsView
          result={result}
          query={query}
          errorMessage={errorMessage}
        />
      </Suspense>
    </PageContainer>
  );
}
