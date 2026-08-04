import { Suspense } from "react";
import { PageContainer } from "@/components/common/page-container";
import { BillsListView } from "@/components/billing";
import { AuthError } from "@/components/auth/auth-error";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { getBillingSummary, getBills } from "@/actions/billing";
import { searchBillSchema } from "@/lib/validators/billing";
import type { BillListResult } from "@/types/billing";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function BillingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsed = searchBillSchema.safeParse({
    q: first(params.q) ?? "",
    paymentStatus: first(params.paymentStatus) ?? "all",
    paymentMethod: first(params.paymentMethod) ?? "all",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "10",
    sortBy: first(params.sortBy) ?? "createdAt",
    sortOrder: first(params.sortOrder) ?? "desc",
  });
  const queryInput = parsed.success
    ? parsed.data
    : searchBillSchema.parse({});

  const [result, summary] = await Promise.all([
    getBills(queryInput),
    getBillingSummary(),
  ]);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const empty: BillListResult = {
    items: [],
    meta: {
      page: queryInput.page,
      pageSize: queryInput.pageSize,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };

  return (
    <PageContainer
      title="Billing"
      description="Handle invoices, payments, and receipts."
    >
      <Suspense fallback={<TableLoadingSkeleton rows={6} columns={6} />}>
        <BillsListView
          result={result.success ? result.data : empty}
          summary={summary.success ? summary.data : null}
          query={{
            q: queryInput.q ?? "",
            paymentStatus: queryInput.paymentStatus,
            paymentMethod: queryInput.paymentMethod,
            page: queryInput.page,
            pageSize: queryInput.pageSize,
            sortBy: queryInput.sortBy,
            sortOrder: queryInput.sortOrder,
          }}
          errorMessage={result.success ? null : result.error.message}
        />
      </Suspense>
    </PageContainer>
  );
}
