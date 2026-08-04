import { MenuItemsListView } from "@/components/menu-items";
import {
  getMenuItemCategoryOptions,
  getMenuItems,
} from "@/actions/menu-items";
import { searchMenuItemSchema } from "@/lib/validators/menu-item";
import { AuthError } from "@/components/auth/auth-error";
import type { MenuItemListResult } from "@/types/menu-item";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function MenuItemsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const parsed = searchMenuItemSchema.safeParse({
    q: first(params.q) ?? "",
    categoryId: first(params.categoryId) ?? "",
    availability: first(params.availability) ?? "all",
    veg: first(params.veg) ?? "all",
    featured: first(params.featured) ?? "all",
    minPrice: first(params.minPrice),
    maxPrice: first(params.maxPrice),
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "10",
    sortBy: first(params.sortBy) ?? "displayOrder",
    sortOrder: first(params.sortOrder) ?? "asc",
  });

  const queryInput = parsed.success
    ? parsed.data
    : searchMenuItemSchema.parse({});

  const [result, categoriesResult] = await Promise.all([
    getMenuItems(queryInput),
    getMenuItemCategoryOptions(),
  ]);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }

  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyResult: MenuItemListResult = {
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
    <MenuItemsListView
      result={result.success ? result.data : emptyResult}
      categoryOptions={
        categoriesResult.success ? categoriesResult.data : []
      }
      query={{
        q: queryInput.q ?? "",
        categoryId: queryInput.categoryId ?? "",
        availability: queryInput.availability,
        veg: queryInput.veg,
        featured: queryInput.featured,
        minPrice:
          queryInput.minPrice != null ? String(queryInput.minPrice) : "",
        maxPrice:
          queryInput.maxPrice != null ? String(queryInput.maxPrice) : "",
        page: queryInput.page,
        pageSize: queryInput.pageSize,
        sortBy: queryInput.sortBy,
        sortOrder: queryInput.sortOrder,
      }}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
