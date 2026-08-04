import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { OrderDetails } from "@/components/orders";
import { AuthError } from "@/components/auth/auth-error";
import { getOrder } from "@/actions/orders";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getOrder(id);

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
      <PageContainer title="Order">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Order details"
      description="Review items, pricing, timeline, and audit history."
    >
      <OrderDetails order={result.data} />
    </PageContainer>
  );
}
