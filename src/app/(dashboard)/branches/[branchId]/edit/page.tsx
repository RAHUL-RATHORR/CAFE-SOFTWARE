import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { BranchForm } from "@/components/branches/branch-form";
import { getBranchById } from "@/actions/branches";
import { AuthError } from "@/components/auth/auth-error";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ branchId: string }>;
};

export default async function EditBranchPage({ params }: PageProps) {
  const { branchId } = await params;
  const result = await getBranchById(branchId);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }
  if (!result.success) {
    notFound();
  }

  return (
    <PageContainer
      title={`Edit ${result.data.name}`}
      description="Update branch identity, contact, and hours."
    >
      <BranchForm mode="edit" branch={result.data} />
    </PageContainer>
  );
}
