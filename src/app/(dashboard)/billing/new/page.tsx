import { PageContainer } from "@/components/common/page-container";
import { PosTerminal } from "@/components/billing";
import { AuthError } from "@/components/auth/auth-error";
import { getPosCatalog } from "@/actions/billing";
import { resolveBillingActor } from "@/actions/billing/context";

export const dynamic = "force-dynamic";

export default async function NewBillingPage() {
  const actor = await resolveBillingActor([
    "billing.create",
    "billing.manage",
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

  const catalog = await getPosCatalog();

  return (
    <PageContainer
      title="POS"
      description="Build a cart, apply discounts and tax, then create a bill."
    >
      <PosTerminal
        catalog={
          catalog.success
            ? catalog.data
            : { categories: [{ id: "all", name: "All" }], items: [] }
        }
      />
    </PageContainer>
  );
}
