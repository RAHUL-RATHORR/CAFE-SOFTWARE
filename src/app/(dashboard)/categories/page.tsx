import { CategoriesListView } from "@/components/categories";
import { getCategories } from "@/actions/categories";
import { searchCategorySchema } from "@/lib/validators/category";
import { AuthError } from "@/components/auth/auth-error";
import type { CategoryListResult } from "@/types/category";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function CategoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const parsed = searchCategorySchema.safeParse({
    q: first(params.q) ?? "",
    status: first(params.status) ?? "all",
    createdFrom: first(params.createdFrom) ?? "",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "10",
    sortBy: first(params.sortBy) ?? "displayOrder",
    sortOrder: first(params.sortOrder) ?? "asc",
  });

  const queryInput = parsed.success
    ? parsed.data
    : searchCategorySchema.parse({});

  const result = await getCategories(queryInput);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }

  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyResult: CategoryListResult = {
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
    <CategoriesListView
      result={result.success ? result.data : emptyResult}
      query={{
        q: queryInput.q ?? "",
        status: queryInput.status,
        createdFrom: queryInput.createdFrom ?? "",
        page: queryInput.page,
        pageSize: queryInput.pageSize,
        sortBy: queryInput.sortBy,
        sortOrder: queryInput.sortOrder,
      }}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
