import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { ShiftDetails } from "@/components/shifts";
import { AuthError } from "@/components/auth/auth-error";
import { getShiftById } from "@/actions/shifts";
import { getEmployeeOptions } from "@/actions/staff";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShiftDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const result = await getShiftById(id);
  const employees = await getEmployeeOptions();

  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED") {
      return <AuthError code="session_expired" />;
    }
    if (result.error.code === "FORBIDDEN") {
      return <AuthError code="forbidden" />;
    }
    if (result.error.code === "NOT_FOUND") notFound();
    return (
      <PageContainer title="Shift">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  const editFlag = Array.isArray(query.edit) ? query.edit[0] : query.edit;

  return (
    <PageContainer
      title="Shift details"
      description="Schedule, assignment, and working hours."
    >
      <ShiftDetails
        shift={result.data}
        employeeOptions={employees.success ? employees.data : []}
        initialEdit={editFlag === "1"}
      />
    </PageContainer>
  );
}
