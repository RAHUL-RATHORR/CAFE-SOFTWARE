"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { CustomersView } from "@/components/customers/customers-view";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useHasPermission } from "@/hooks/rbac";
import { cn } from "@/lib/utils";
import type { CustomerListResult } from "@/types/customer";

export type CustomersListQuery = {
  q: string;
  status: string;
  tag: string;
  vipOnly: boolean;
  minOrders: string;
  maxOrders: string;
  minSpent: string;
  maxSpent: string;
  lastVisitFrom: string;
  lastVisitTo: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

type CustomersListViewProps = {
  result: CustomerListResult;
  query: CustomersListQuery;
  errorMessage?: string | null;
};

export function CustomersListView({
  result,
  query,
  errorMessage,
}: CustomersListViewProps) {
  const canCreate = useHasPermission([
    "customers.create",
    "customers.manage",
  ]);

  return (
    <PageContainer
      title="Customers"
      description="Manage guest profiles, loyalty, and visit history."
      actions={
        canCreate.allowed ? (
          <Link
            href="/customers/new"
            className={cn(buttonVariants(), "rounded-xl")}
          >
            New customer
          </Link>
        ) : null
      }
    >
      <Suspense fallback={<TableLoadingSkeleton rows={6} columns={8} />}>
        <CustomersView
          result={result}
          query={query}
          errorMessage={errorMessage}
        />
      </Suspense>
    </PageContainer>
  );
}
