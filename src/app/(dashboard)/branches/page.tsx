import { BranchesListView } from "@/components/branches/branches-list-view";
import { getBranches } from "@/actions/branches";
import { searchBranchSchema } from "@/lib/validators/branch";
import { AuthError } from "@/components/auth/auth-error";
import type { BranchListResult } from "@/types/branch";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function BranchesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const parsed = searchBranchSchema.safeParse({
    q: first(params.q) ?? "",
    status: first(params.status) ?? "all",
    active: first(params.active) ?? "all",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "10",
    sortBy: first(params.sortBy) ?? "name",
    sortOrder: first(params.sortOrder) ?? "asc",
  });

  const queryInput = parsed.success
    ? parsed.data
    : searchBranchSchema.parse({});

  const result = await getBranches(queryInput);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }

  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyResult: BranchListResult = {
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
    <BranchesListView
      result={result.success ? result.data : emptyResult}
      query={{
        q: queryInput.q ?? "",
        status: queryInput.status,
        active: queryInput.active,
        page: queryInput.page,
        pageSize: queryInput.pageSize,
        sortBy: queryInput.sortBy,
        sortOrder: queryInput.sortOrder,
      }}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
