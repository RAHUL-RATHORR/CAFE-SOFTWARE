import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { BillDetails } from "@/components/billing";
import { AuthError } from "@/components/auth/auth-error";
import { getBill, getBillPayments } from "@/actions/billing";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BillDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [billResult, paymentsResult] = await Promise.all([
    getBill(id),
    getBillPayments(id),
  ]);

  if (!billResult.success) {
    if (billResult.error.code === "UNAUTHORIZED") {
      return <AuthError code="session_expired" />;
    }
    if (billResult.error.code === "FORBIDDEN") {
      return <AuthError code="forbidden" />;
    }
    if (billResult.error.code === "NOT_FOUND") {
      notFound();
    }
    return (
      <PageContainer title="Bill">
        <p className="text-sm text-destructive">{billResult.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Bill details"
      description="Payments, refunds, and invoice actions."
    >
      <BillDetails
        bill={billResult.data}
        payments={paymentsResult.success ? paymentsResult.data : []}
      />
    </PageContainer>
  );
}
