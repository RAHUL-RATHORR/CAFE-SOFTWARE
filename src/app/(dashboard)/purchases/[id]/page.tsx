import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { PurchaseOrderDetails } from "@/components/purchases";
import { AuthError } from "@/components/auth/auth-error";
import { getPurchaseOrderById } from "@/actions/purchases";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PurchaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getPurchaseOrderById(id);

  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED") {
      return <AuthError code="session_expired" />;
    }
    if (result.error.code === "FORBIDDEN") {
      return <AuthError code="forbidden" />;
    }
    if (result.error.code === "NOT_FOUND") notFound();
    return (
      <PageContainer title="Purchase">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Purchase details"
      description="Order lines, status workflow, and goods receipt foundation."
    >
      <PurchaseOrderDetails purchase={result.data} />
    </PageContainer>
  );
}
