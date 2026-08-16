import { trackOrderByPublicToken } from "@/actions/qr-ordering";
import { OrderUnavailableView } from "@/components/qr-ordering/order-unavailable-view";
import { PublicOrderConfirmationView } from "@/components/qr-ordering/public-order-confirmation-view";
import { resolveOrderingSession } from "@/lib/qr-ordering/resolve-ordering-session";
import { PUBLIC_ORDER_STATUS_LABELS } from "@/config/qr-ordering";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ tableToken: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function PublicOrderConfirmationPage({
  params,
  searchParams,
}: PageProps) {
  const { tableToken: raw } = await params;
  const { token } = await searchParams;
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

  if (!token?.trim()) {
    return (
      <OrderUnavailableView
        title="Confirmation unavailable"
        description="Missing order tracking token. Place an order from checkout to continue."
      />
    );
  }

  const tracked = await trackOrderByPublicToken(token.trim());
  if (!tracked.success) {
    return (
      <OrderUnavailableView
        title="Order not found"
        description={tracked.error.message}
      />
    );
  }

  const { restaurant, branch, table } = session.data;
  const status = tracked.data.order?.status ?? tracked.data.placeholder.status;

  return (
    <PublicOrderConfirmationView
      tableToken={session.data.tableToken}
      restaurantName={restaurant.name}
      restaurantLogo={restaurant.logo}
      branchName={branch.name}
      tableLabel={`${table.tableName} (${table.tableNumber})`}
      currency={restaurant.currency}
      confirmation={{
        orderNumber: tracked.data.placeholder.orderNumber,
        trackingToken: tracked.data.placeholder.trackingToken,
        tableLabel:
          tracked.data.tableLabel ??
          `${table.tableName} (${table.tableNumber})`,
        grandTotal: tracked.data.order?.grandTotal ?? 0,
        currency: restaurant.currency,
        statusLabel: PUBLIC_ORDER_STATUS_LABELS[status],
      }}
    />
  );
}
