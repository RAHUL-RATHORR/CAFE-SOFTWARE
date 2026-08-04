import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ restaurant: string; table: string }>;
};

/**
 * Table QR entry — identifies the table and opens the digital menu.
 */
export default async function PublicTableMenuPage({ params }: PageProps) {
  const { restaurant, table } = await params;
  const restaurantParam = encodeURIComponent(decodeURIComponent(restaurant));
  const tableParam = encodeURIComponent(decodeURIComponent(table));
  redirect(`/menu/${restaurantParam}?table=${tableParam}`);
}
