import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { VendorForm } from "@/components/vendors";
import { AuthError } from "@/components/auth/auth-error";
import { getVendorById } from "@/actions/vendors";
import { resolveVendorActor } from "@/actions/vendors/context";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditVendorPage({ params }: PageProps) {
  const actor = await resolveVendorActor(["vendors.edit"]);
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
  const result = await getVendorById(id);

  if (!result.success) {
    if (result.error.code === "NOT_FOUND") notFound();
    return (
      <PageContainer title="Edit vendor">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit vendor"
      description={`Update “${result.data.companyName}”.`}
    >
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <VendorForm mode="edit" vendor={result.data} />
      </div>
    </PageContainer>
  );
}
