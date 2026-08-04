import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { ShiftForm } from "@/components/shifts";
import { AuthError } from "@/components/auth/auth-error";
import { getShiftById } from "@/actions/shifts";
import { resolveShiftActor } from "@/actions/shifts/context";
import { getEmployeeOptions } from "@/actions/staff";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditShiftPage({ params }: PageProps) {
  const actor = await resolveShiftActor(["shifts.edit", "staff.manage"]);
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
  const [result, employees] = await Promise.all([
    getShiftById(id),
    getEmployeeOptions(),
  ]);

  if (!result.success) {
    if (result.error.code === "NOT_FOUND") notFound();
    return (
      <PageContainer title="Edit shift">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit shift"
      description={`Update “${result.data.shiftName}”.`}
    >
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <ShiftForm
          mode="edit"
          shift={result.data}
          employeeOptions={employees.success ? employees.data : []}
        />
      </div>
    </PageContainer>
  );
}
