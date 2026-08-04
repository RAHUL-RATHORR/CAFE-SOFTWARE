import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { PurchaseOrderForm } from "@/components/purchases";
import { AuthError } from "@/components/auth/auth-error";
import {
  getPurchaseFormOptions,
  getPurchaseOrderById,
} from "@/actions/purchases";
import { resolvePurchaseActor } from "@/actions/purchases/context";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPurchasePage({ params }: PageProps) {
  const actor = await resolvePurchaseActor([
    "purchases.edit",
    "purchases.manage",
  ]);
  if (!actor.success) {
    return (
      <AuthError
        code={
          actor.error.code === "UNAUTHORIZED" ? "session_expired" : "forbidden"
        }
      />
    );
  }

  const { id } = await params;
  const [result, options] = await Promise.all([
    getPurchaseOrderById(id),
    getPurchaseFormOptions(),
  ]);

  if (!result.success) {
    if (result.error.code === "NOT_FOUND") notFound();
    return (
      <PageContainer title="Edit purchase">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  if (!options.success) {
    return (
      <PageContainer title="Edit purchase">
        <p className="text-sm text-destructive">{options.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit purchase"
      description={`Update “${result.data.purchaseNumber}”.`}
    >
      <div className="mx-auto w-full max-w-4xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <PurchaseOrderForm
          mode="edit"
          purchase={result.data}
          options={options.data}
        />
      </div>
    </PageContainer>
  );
}
