import { PublicCartView } from "@/components/qr-ordering";
import { getPublicMenu } from "@/actions/qr-ordering";
import { EmptyState } from "@/components/common/empty-state";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ restaurant: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PublicCartPage({
  params,
  searchParams,
}: PageProps) {
  const { restaurant } = await params;
  const query = await searchParams;
  const restaurantParam = decodeURIComponent(restaurant);
  const table = first(query.table);
  const result = await getPublicMenu(restaurantParam, { table, pageSize: 1 });

  if (!result.success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState title="Cart unavailable" description={result.error.message} />
      </div>
    );
  }

  return (
    <PublicCartView
      restaurantParam={restaurantParam}
      restaurantName={result.data.restaurant.name}
      currency={result.data.restaurant.currency}
      tableParam={table}
      tableLabel={result.data.table?.tableNumber}
    />
  );
}
