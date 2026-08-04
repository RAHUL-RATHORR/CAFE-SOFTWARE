import { PageContainer } from "@/components/common/page-container";
import { PurchaseOrderForm } from "@/components/purchases";
import { AuthError } from "@/components/auth/auth-error";
import { resolvePurchaseActor } from "@/actions/purchases/context";
import { getPurchaseFormOptions } from "@/actions/purchases";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function NewPurchasePage({ searchParams }: PageProps) {
  const actor = await resolvePurchaseActor([
    "purchases.create",
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

  const params = await searchParams;
  const options = await getPurchaseFormOptions();
  if (!options.success) {
    return (
      <PageContainer title="New purchase">
        <p className="text-sm text-destructive">{options.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="New purchase order"
      description="Create a supplier purchase with ingredient line items."
    >
      <div className="mx-auto w-full max-w-4xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <PurchaseOrderForm
          mode="create"
          options={options.data}
          defaultVendorId={first(params.vendorId) ?? null}
        />
      </div>
    </PageContainer>
  );
}
