import { OrderUnavailableView } from "@/components/qr-ordering/order-unavailable-view";
import { PublicOrderCartView } from "@/components/qr-ordering/public-order-cart-view";
import { resolveOrderingSession } from "@/lib/qr-ordering/resolve-ordering-session";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ tableToken: string }>;
};

export default async function PublicOrderCartPage({ params }: PageProps) {
  const { tableToken: raw } = await params;
  const tableToken = decodeURIComponent(raw);
  const session = await resolveOrderingSession(tableToken);
  if (!session.success) {
    return (
      <OrderUnavailableView
        title={session.title}
        description={session.description}
      />
    );
  }

  const { restaurant, branch, table } = session.data;
  return (
    <PublicOrderCartView
      tableToken={session.data.tableToken}
      restaurantName={restaurant.name}
      restaurantLogo={restaurant.logo}
      branchName={branch.name}
      tableLabel={`${table.tableName} (${table.tableNumber})`}
      currency={restaurant.currency}
    />
  );
}
