import { trackOrderByPublicToken } from "@/actions/qr-ordering";
import { PublicOrderStatusView } from "@/components/qr-ordering/public-order-status-view";
import { OrderUnavailableView } from "@/components/qr-ordering/order-unavailable-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ publicOrderToken: string }>;
};

export default async function PublicOrderStatusPage({ params }: PageProps) {
  const { publicOrderToken: raw } = await params;
  const publicOrderToken = decodeURIComponent(raw);

  const tracked = await trackOrderByPublicToken(publicOrderToken);
  if (!tracked.success) {
    return (
      <OrderUnavailableView
        title="Order not found"
        description={tracked.error.message}
      />
    );
  }

  return (
    <PublicOrderStatusView
      publicOrderToken={publicOrderToken}
      initialPayload={tracked.data}
    />
  );
}
