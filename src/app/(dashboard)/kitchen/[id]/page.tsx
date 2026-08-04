import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { KitchenOrderDetails } from "@/components/kitchen";
import { AuthError } from "@/components/auth/auth-error";
import { getKitchenOrder } from "@/actions/kitchen";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function KitchenOrderPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getKitchenOrder(id);

  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED") {
      return <AuthError code="session_expired" />;
    }
    if (result.error.code === "FORBIDDEN") {
      return <AuthError code="forbidden" />;
    }
    if (result.error.code === "NOT_FOUND") {
      notFound();
    }
    return (
      <PageContainer title="Kitchen ticket">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Kitchen ticket"
      description="Items, notes, timeline, and quick status controls."
    >
      <KitchenOrderDetails ticket={result.data} />
    </PageContainer>
  );
}
