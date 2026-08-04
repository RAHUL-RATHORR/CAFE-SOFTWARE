import { VendorsListView } from "@/components/vendors";
import { getVendors } from "@/actions/vendors";
import { searchVendorSchema } from "@/lib/validators/vendor";
import { AuthError } from "@/components/auth/auth-error";
import type { VendorListResult } from "@/types/vendor";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function VendorsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const parsed = searchVendorSchema.safeParse({
    q: first(params.q) ?? "",
    status: first(params.status) ?? "all",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "10",
    sortBy: first(params.sortBy) ?? "createdAt",
    sortOrder: first(params.sortOrder) ?? "desc",
  });

  const queryInput = parsed.success
    ? parsed.data
    : searchVendorSchema.parse({});

  const result = await getVendors(queryInput);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyResult: VendorListResult = {
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
    <VendorsListView
      result={result.success ? result.data : emptyResult}
      query={{
        q: queryInput.q ?? "",
        status: queryInput.status,
        page: queryInput.page,
        pageSize: queryInput.pageSize,
        sortBy: queryInput.sortBy,
        sortOrder: queryInput.sortOrder,
      }}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
