"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { PurchasesView } from "@/components/purchases/purchases-view";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useHasPermission } from "@/hooks/rbac";
import { cn } from "@/lib/utils";
import type { PurchaseOrderListResult } from "@/types/purchase";
import type { VendorSelectOption } from "@/types/vendor";

export type PurchasesListQuery = {
  q: string;
  status: string;
  vendorId: string;
  minAmount: string;
  maxAmount: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

type PurchasesListViewProps = {
  result: PurchaseOrderListResult;
  query: PurchasesListQuery;
  vendors: VendorSelectOption[];
  errorMessage?: string | null;
};

export function PurchasesListView({
  result,
  query,
  vendors,
  errorMessage,
}: PurchasesListViewProps) {
  const canCreate = useHasPermission([
    "purchases.create",
    "purchases.manage",
  ]);

  return (
    <PageContainer
      title="Purchases"
      description="Purchase orders, receipts, and supplier history."
      actions={
        canCreate.allowed ? (
          <Link
            href="/purchases/new"
            className={cn(buttonVariants(), "rounded-xl")}
          >
            New purchase
          </Link>
        ) : null
      }
    >
      <Suspense fallback={<TableLoadingSkeleton rows={6} columns={8} />}>
        <PurchasesView
          result={result}
          query={query}
          vendors={vendors}
          errorMessage={errorMessage}
        />
      </Suspense>
    </PageContainer>
  );
}
