import { PageContainer } from "@/components/common/page-container";
import { CustomerForm } from "@/components/customers";
import { AuthError } from "@/components/auth/auth-error";
import { resolveCustomerActor } from "@/actions/customers/context";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  const actor = await resolveCustomerActor([
    "customers.create",
    "customers.manage",
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

  return (
    <PageContainer
      title="New customer"
      description="Create a guest profile with contact details and preferences."
    >
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <CustomerForm mode="create" />
      </div>
    </PageContainer>
  );
}
