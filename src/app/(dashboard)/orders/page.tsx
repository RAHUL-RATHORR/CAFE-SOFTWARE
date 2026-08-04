import { OrdersListView } from "@/components/orders";
import { getOrderFormOptions, getOrders } from "@/actions/orders";
import { searchOrderSchema } from "@/lib/validators/order";
import { AuthError } from "@/components/auth/auth-error";
import { CUSTOMER_OPTIONS } from "@/config/orders";
import type { RestaurantOrderListResult } from "@/types/order";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const parsed = searchOrderSchema.safeParse({
    q: first(params.q) ?? "",
    status: first(params.status) ?? "all",
    orderType: first(params.orderType) ?? "all",
    paymentStatus: first(params.paymentStatus) ?? "all",
    tableId: first(params.tableId) ?? "",
    customerId: first(params.customerId) ?? "",
    dateFrom: first(params.dateFrom) ?? "",
    dateTo: first(params.dateTo) ?? "",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "10",
    sortBy: first(params.sortBy) ?? "createdAt",
    sortOrder: first(params.sortOrder) ?? "desc",
  });

  const queryInput = parsed.success
    ? parsed.data
    : searchOrderSchema.parse({});

  const [result, options] = await Promise.all([
    getOrders(queryInput),
    getOrderFormOptions(),
  ]);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }

  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyResult: RestaurantOrderListResult = {
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
    <OrdersListView
      result={result.success ? result.data : emptyResult}
      filterOptions={{
        tables: options.success ? options.data.tables : [],
        customers: options.success ? options.data.customers : CUSTOMER_OPTIONS,
      }}
      query={{
        q: queryInput.q ?? "",
        status: queryInput.status,
        orderType: queryInput.orderType,
        paymentStatus: queryInput.paymentStatus,
        tableId: queryInput.tableId ?? "",
        customerId: queryInput.customerId ?? "",
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
