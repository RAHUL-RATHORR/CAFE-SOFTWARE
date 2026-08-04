import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { EmployeeDetails } from "@/components/staff";
import { AuthError } from "@/components/auth/auth-error";
import { getEmployeeById } from "@/actions/staff";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getEmployeeById(id);

  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED") {
      return <AuthError code="session_expired" />;
    }
    if (result.error.code === "FORBIDDEN") {
      return <AuthError code="forbidden" />;
    }
    if (result.error.code === "NOT_FOUND") notFound();
    return (
      <PageContainer title="Employee">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Employee profile"
      description="Staff details, attendance, and leave foundations."
    >
      <EmployeeDetails employee={result.data} />
    </PageContainer>
  );
}
