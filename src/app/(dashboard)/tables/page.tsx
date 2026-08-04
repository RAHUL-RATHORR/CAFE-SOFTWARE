import { RestaurantTablesListView } from "@/components/restaurant-tables";
import { getTables } from "@/actions/tables";
import { searchRestaurantTableSchema } from "@/lib/validators/restaurant-table";
import { AuthError } from "@/components/auth/auth-error";
import type { RestaurantTableListResult } from "@/types/restaurant-table";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function TablesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const parsed = searchRestaurantTableSchema.safeParse({
    q: first(params.q) ?? "",
    status: first(params.status) ?? "all",
    floorId: first(params.floorId) ?? "",
    minCapacity: first(params.minCapacity),
    maxCapacity: first(params.maxCapacity),
    active: first(params.active) ?? "all",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "10",
    sortBy: first(params.sortBy) ?? "displayOrder",
    sortOrder: first(params.sortOrder) ?? "asc",
  });

  const queryInput = parsed.success
    ? parsed.data
    : searchRestaurantTableSchema.parse({});

  const viewParam = first(params.view);
  const view = viewParam === "cards" ? "cards" : "table";

  const result = await getTables(queryInput);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }

  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyResult: RestaurantTableListResult = {
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
    <RestaurantTablesListView
      result={result.success ? result.data : emptyResult}
      query={{
        q: queryInput.q ?? "",
        status: queryInput.status,
        floorId: queryInput.floorId ?? "",
        minCapacity:
          queryInput.minCapacity != null
            ? String(queryInput.minCapacity)
            : "",
        maxCapacity:
          queryInput.maxCapacity != null
            ? String(queryInput.maxCapacity)
            : "",
        active: queryInput.active,
        page: queryInput.page,
        pageSize: queryInput.pageSize,
        sortBy: queryInput.sortBy,
        sortOrder: queryInput.sortOrder,
        view,
      }}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
