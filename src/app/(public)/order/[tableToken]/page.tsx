import { getOrderingMenuByToken } from "@/actions/qr-ordering";
import { OrderUnavailableView } from "@/components/qr-ordering/order-unavailable-view";
import { PublicOrderMenuView } from "@/components/qr-ordering/public-order-menu-view";
import { resolveOrderingSession } from "@/lib/qr-ordering/resolve-ordering-session";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ tableToken: string }>;
};

export default async function PublicOrderMenuPage({ params }: PageProps) {
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

  const menu = await getOrderingMenuByToken(tableToken);
  if (!menu.success) {
    return (
      <OrderUnavailableView
        title="Unable to load menu"
        description={menu.error.message}
      />
    );
  }

  return <PublicOrderMenuView payload={menu.data} />;
}
