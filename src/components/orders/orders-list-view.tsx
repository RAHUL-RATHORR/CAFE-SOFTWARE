"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { OrdersView } from "@/components/orders/orders-view";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useHasPermission } from "@/hooks/rbac";
import { cn } from "@/lib/utils";
import type { OrderFormOptions, RestaurantOrderListResult } from "@/types/order";

type OrdersListViewProps = {
  result: RestaurantOrderListResult;
  filterOptions: Pick<OrderFormOptions, "tables" | "customers">;
  query: {
    q: string;
    status: string;
    orderType: string;
    paymentStatus: string;
    tableId: string;
    customerId: string;
    dateFrom: string;
    dateTo: string;
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  errorMessage?: string | null;
};

export function OrdersListView({
  result,
  filterOptions,
  query,
  errorMessage,
}: OrdersListViewProps) {
  const canCreate = useHasPermission(["orders.create", "orders.manage"]);

  return (
    <PageContainer
      title="Orders"
      description="Track dine-in, takeaway, and delivery orders."
      actions={
        canCreate.allowed ? (
          <Link
            href="/orders/new"
            className={cn(buttonVariants(), "rounded-xl")}
          >
            New order
          </Link>
        ) : null
      }
    >
      <Suspense fallback={<TableLoadingSkeleton rows={6} columns={8} />}>
        <OrdersView
          result={result}
          filterOptions={filterOptions}
          query={query}
          errorMessage={errorMessage}
        />
      </Suspense>
    </PageContainer>
  );
}
