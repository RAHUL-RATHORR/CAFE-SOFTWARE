import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { EmployeeForm } from "@/components/staff";
import { AuthError } from "@/components/auth/auth-error";
import { getEmployeeById } from "@/actions/staff";
import { resolveStaffActor } from "@/actions/staff/context";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditStaffPage({ params }: PageProps) {
  const actor = await resolveStaffActor(["staff.edit", "staff.manage"]);
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
  const result = await getEmployeeById(id);

  if (!result.success) {
    if (result.error.code === "NOT_FOUND") notFound();
    return (
      <PageContainer title="Edit employee">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit employee"
      description={`Update “${result.data.fullName}”.`}
    >
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <EmployeeForm mode="edit" employee={result.data} />
      </div>
    </PageContainer>
  );
}
