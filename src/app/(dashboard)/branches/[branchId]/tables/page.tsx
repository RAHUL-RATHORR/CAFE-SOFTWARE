import { notFound } from "next/navigation";
import { BranchTablesView } from "@/components/branches/branch-tables-view";
import { getBranchById } from "@/actions/branches";
import { getTables } from "@/actions/tables";
import { AuthError } from "@/components/auth/auth-error";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ branchId: string }>;
};

export default async function BranchTablesPage({ params }: PageProps) {
  const { branchId } = await params;
  const branchResult = await getBranchById(branchId);

  if (!branchResult.success && branchResult.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!branchResult.success && branchResult.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }
  if (!branchResult.success) {
    notFound();
  }

  const tablesResult = await getTables({
    branchId,
    page: 1,
    pageSize: 100,
    status: "all",
    active: "all",
    sortBy: "tableNumber",
    sortOrder: "asc",
  });

  return (
    <BranchTablesView
      branch={branchResult.data}
      tables={tablesResult.success ? tablesResult.data.items : []}
      errorMessage={tablesResult.success ? null : tablesResult.error.message}
    />
  );
}
