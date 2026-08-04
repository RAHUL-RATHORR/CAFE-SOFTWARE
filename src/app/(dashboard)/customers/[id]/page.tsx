import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { CustomerProfileView } from "@/components/customers";
import { AuthError } from "@/components/auth/auth-error";
import { getCustomerProfile } from "@/actions/customers";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getCustomerProfile(id);

  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED") {
      return <AuthError code="session_expired" />;
    }
    if (result.error.code === "FORBIDDEN") {
      return <AuthError code="forbidden" />;
    }
    if (result.error.code === "NOT_FOUND") {
      notFound();
    }
    return (
      <PageContainer title="Customer">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Customer profile"
      description="View contact details, loyalty, orders, and visit history."
    >
      <CustomerProfileView profile={result.data} />
    </PageContainer>
  );
}
