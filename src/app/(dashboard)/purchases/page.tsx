import { PurchasesListView } from "@/components/purchases";
import { getPurchaseOrders } from "@/actions/purchases";
import { getVendorOptions } from "@/actions/vendors";
import { searchPurchaseOrderSchema } from "@/lib/validators/purchase";
import { AuthError } from "@/components/auth/auth-error";
import type { PurchaseOrderListResult } from "@/types/purchase";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function PurchasesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const parsed = searchPurchaseOrderSchema.safeParse({
    q: first(params.q) ?? "",
    status: first(params.status) ?? "all",
    vendorId: first(params.vendorId) ?? "",
    minAmount: first(params.minAmount),
    maxAmount: first(params.maxAmount),
    dateFrom: first(params.dateFrom) ?? "",
    dateTo: first(params.dateTo) ?? "",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "10",
    sortBy: first(params.sortBy) ?? "createdAt",
    sortOrder: first(params.sortOrder) ?? "desc",
  });

  const queryInput = parsed.success
    ? parsed.data
    : searchPurchaseOrderSchema.parse({});

  const [result, vendorsResult] = await Promise.all([
    getPurchaseOrders(queryInput),
    getVendorOptions(),
  ]);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyResult: PurchaseOrderListResult = {
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
    <PurchasesListView
      result={result.success ? result.data : emptyResult}
      vendors={vendorsResult.success ? vendorsResult.data : []}
      query={{
        q: queryInput.q ?? "",
        status: queryInput.status,
        vendorId: queryInput.vendorId ?? "",
        minAmount:
          queryInput.minAmount != null ? String(queryInput.minAmount) : "",
        maxAmount:
          queryInput.maxAmount != null ? String(queryInput.maxAmount) : "",
        dateFrom: queryInput.dateFrom ?? "",
        dateTo: queryInput.dateTo ?? "",
        page: queryInput.page,
        pageSize: queryInput.pageSize,
        sortBy: queryInput.sortBy,
        sortOrder: queryInput.sortOrder,
      }}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
