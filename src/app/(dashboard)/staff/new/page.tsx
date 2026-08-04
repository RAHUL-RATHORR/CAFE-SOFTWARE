import { PageContainer } from "@/components/common/page-container";
import { EmployeeForm } from "@/components/staff";
import { AuthError } from "@/components/auth/auth-error";
import { resolveStaffActor } from "@/actions/staff/context";

export const dynamic = "force-dynamic";

export default async function NewStaffPage() {
  const actor = await resolveStaffActor(["staff.create", "staff.manage"]);
  if (!actor.success) {
    return (
      <AuthError
        code={
          actor.error.code === "UNAUTHORIZED" ? "session_expired" : "forbidden"
        }
      />
    );
  }

  return (
    <PageContainer
      title="New employee"
      description="Add a team member with role, department, and designation."
    >
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <EmployeeForm mode="create" />
      </div>
    </PageContainer>
  );
}
