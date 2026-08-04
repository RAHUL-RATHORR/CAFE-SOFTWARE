import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { CustomerForm } from "@/components/customers";
import { AuthError } from "@/components/auth/auth-error";
import { getCustomerById } from "@/actions/customers";
import { resolveCustomerActor } from "@/actions/customers/context";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCustomerPage({ params }: PageProps) {
  const actor = await resolveCustomerActor([
    "customers.edit",
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

  const { id } = await params;
  const result = await getCustomerById(id);

  if (!result.success) {
    if (result.error.code === "NOT_FOUND") notFound();
    return (
      <PageContainer title="Edit customer">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit customer"
      description={`Update “${result.data.fullName}”.`}
    >
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <CustomerForm mode="edit" customer={result.data} />
      </div>
    </PageContainer>
  );
}
