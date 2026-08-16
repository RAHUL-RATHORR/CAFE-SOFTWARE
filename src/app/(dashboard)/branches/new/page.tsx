import { PageContainer } from "@/components/common/page-container";
import { BranchForm } from "@/components/branches/branch-form";
import { AuthError } from "@/components/auth/auth-error";
import { resolveBranchActor } from "@/actions/branches/context";

export const dynamic = "force-dynamic";

export default async function NewBranchPage() {
  const actor = await resolveBranchActor([
    "branches.create",
    "branches.manage",
  ]);
  if (!actor.success && actor.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!actor.success && actor.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  return (
    <PageContainer
      title="New branch"
      description="Add an outlet with contact, location, and default settings."
    >
      <BranchForm mode="create" />
    </PageContainer>
  );
}
