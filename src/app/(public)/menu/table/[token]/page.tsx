import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

/** Prompt 44 compatibility — new customer entry is `/order/[tableToken]`. */
export default async function LegacyOpaqueTableQrPage({ params }: PageProps) {
  const { token } = await params;
  redirect(`/order/${encodeURIComponent(decodeURIComponent(token))}`);
}
