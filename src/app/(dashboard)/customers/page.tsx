import { CustomersListView } from "@/components/customers";
import { getCustomers } from "@/actions/customers";
import { searchCustomerSchema } from "@/lib/validators/customer";
import { AuthError } from "@/components/auth/auth-error";
import type { CustomerListResult } from "@/types/customer";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const parsed = searchCustomerSchema.safeParse({
    q: first(params.q) ?? "",
    status: first(params.status) ?? "all",
    tag: first(params.tag) ?? "",
    vipOnly: first(params.vipOnly) ?? "false",
    minOrders: first(params.minOrders),
    maxOrders: first(params.maxOrders),
    minSpent: first(params.minSpent),
    maxSpent: first(params.maxSpent),
    lastVisitFrom: first(params.lastVisitFrom) ?? "",
    lastVisitTo: first(params.lastVisitTo) ?? "",
    dateFrom: first(params.dateFrom) ?? "",
    dateTo: first(params.dateTo) ?? "",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "10",
    sortBy: first(params.sortBy) ?? "createdAt",
    sortOrder: first(params.sortOrder) ?? "desc",
  });

  const queryInput = parsed.success
    ? parsed.data
    : searchCustomerSchema.parse({});

  const result = await getCustomers(queryInput);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }

  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyResult: CustomerListResult = {
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
    <CustomersListView
      result={result.success ? result.data : emptyResult}
      query={{
        q: queryInput.q ?? "",
        status: queryInput.status,
        tag: queryInput.tag ?? "",
        vipOnly: queryInput.vipOnly,
        minOrders:
          queryInput.minOrders != null ? String(queryInput.minOrders) : "",
        maxOrders:
          queryInput.maxOrders != null ? String(queryInput.maxOrders) : "",
        minSpent:
          queryInput.minSpent != null ? String(queryInput.minSpent) : "",
        maxSpent:
          queryInput.maxSpent != null ? String(queryInput.maxSpent) : "",
        lastVisitFrom: queryInput.lastVisitFrom ?? "",
        lastVisitTo: queryInput.lastVisitTo ?? "",
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
