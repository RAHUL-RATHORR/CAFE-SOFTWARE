import { notFound } from "next/navigation";
import { BranchDetails } from "@/components/branches/branch-details";
import { getBranchById } from "@/actions/branches";
import { AuthError } from "@/components/auth/auth-error";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ branchId: string }>;
};

export default async function BranchDetailPage({ params }: PageProps) {
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

  return <BranchDetails branch={result.data} />;
}
