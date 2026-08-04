import { PageContainer } from "@/components/common/page-container";
import { VendorForm } from "@/components/vendors";
import { AuthError } from "@/components/auth/auth-error";
import { resolveVendorActor } from "@/actions/vendors/context";

export const dynamic = "force-dynamic";

export default async function NewVendorPage() {
  const actor = await resolveVendorActor(["vendors.create"]);
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
      title="New vendor"
      description="Add a supplier with contact and tax details."
    >
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <VendorForm mode="create" />
      </div>
    </PageContainer>
  );
}
