import { PublicCategoriesView } from "@/components/qr-ordering";
import { getCategories, getPublicMenu } from "@/actions/qr-ordering";
import { EmptyState } from "@/components/common/empty-state";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ restaurant: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PublicCategoriesPage({
  params,
  searchParams,
}: PageProps) {
  const { restaurant } = await params;
  const query = await searchParams;
  const restaurantParam = decodeURIComponent(restaurant);
  const table = first(query.table);

  const [menuResult, categoriesResult] = await Promise.all([
    getPublicMenu(restaurantParam, { table, pageSize: 1 }),
    getCategories(restaurantParam),
  ]);

  if (!menuResult.success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title="Categories unavailable"
          description={menuResult.error.message}
        />
      </div>
    );
  }

  return (
    <PublicCategoriesView
      restaurantParam={restaurantParam}
      restaurantName={menuResult.data.restaurant.name}
      tableParam={table}
      tableLabel={menuResult.data.table?.tableNumber}
      categories={categoriesResult.success ? categoriesResult.data : []}
    />
  );
}
