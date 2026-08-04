import { PageContainer } from "@/components/common/page-container";
import { ShiftForm } from "@/components/shifts";
import { AuthError } from "@/components/auth/auth-error";
import { resolveShiftActor } from "@/actions/shifts/context";
import { getEmployeeOptions } from "@/actions/staff";

export const dynamic = "force-dynamic";

export default async function NewShiftPage() {
  const actor = await resolveShiftActor(["shifts.create", "staff.manage"]);
  if (!actor.success) {
    return (
      <AuthError
        code={
          actor.error.code === "UNAUTHORIZED" ? "session_expired" : "forbidden"
        }
      />
    );
  }

  const employees = await getEmployeeOptions();

  return (
    <PageContainer
      title="New shift"
      description="Define schedule hours and optionally assign an employee."
    >
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <ShiftForm
          mode="create"
          employeeOptions={employees.success ? employees.data : []}
        />
      </div>
    </PageContainer>
  );
}
