import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { InvoicePreview } from "@/components/billing";
import { AuthError } from "@/components/auth/auth-error";
import { generateInvoice, getReceipt } from "@/actions/billing";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BillInvoicePage({ params }: PageProps) {
  const { id } = await params;
  const [invoiceResult, receiptResult] = await Promise.all([
    generateInvoice({ billId: id }),
    getReceipt(id),
  ]);

  if (!invoiceResult.success) {
    if (invoiceResult.error.code === "UNAUTHORIZED") {
      return <AuthError code="session_expired" />;
    }
    if (invoiceResult.error.code === "FORBIDDEN") {
      return <AuthError code="forbidden" />;
    }
    if (invoiceResult.error.code === "NOT_FOUND") {
      notFound();
    }
    return (
      <PageContainer title="Invoice">
        <p className="text-sm text-destructive">{invoiceResult.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Invoice & receipt"
      description="Preview invoice and guest receipt."
    >
      <InvoicePreview
        invoice={invoiceResult.data}
        receipt={
          receiptResult.success
            ? receiptResult.data
            : {
                bill: invoiceResult.data.bill,
                payments: invoiceResult.data.payments,
                printedAt: null,
                delivery: { print: "pending", email: "pending" },
              }
        }
      />
    </PageContainer>
  );
}
