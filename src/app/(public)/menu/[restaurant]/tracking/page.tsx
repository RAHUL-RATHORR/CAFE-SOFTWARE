import { PublicTrackingView } from "@/components/qr-ordering";
import { getPublicMenu, trackOrder } from "@/actions/qr-ordering";
import { EmptyState } from "@/components/common/empty-state";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ restaurant: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PublicTrackingPage({
  params,
  searchParams,
}: PageProps) {
  const { restaurant } = await params;
  const query = await searchParams;
  const restaurantParam = decodeURIComponent(restaurant);
  const table = first(query.table);
  const token = first(query.token) ?? "";

  const menuResult = await getPublicMenu(restaurantParam, {
    table,
    pageSize: 1,
  });
  if (!menuResult.success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title="Tracking unavailable"
          description={menuResult.error.message}
        />
      </div>
    );
  }

  const trackResult = token
    ? await trackOrder(restaurantParam, token)
    : null;

  return (
    <PublicTrackingView
      restaurantParam={restaurantParam}
      restaurantName={menuResult.data.restaurant.name}
      tableParam={table}
      tableLabel={menuResult.data.table?.tableNumber}
      initialToken={token}
      initialPayload={
        trackResult?.success ? trackResult.data : null
      }
    />
  );
}
