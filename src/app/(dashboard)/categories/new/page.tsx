import { PageContainer } from "@/components/common/page-container";
import { CategoryForm } from "@/components/categories";
import { AuthError } from "@/components/auth/auth-error";
import { resolveCategoryActor } from "@/actions/categories/context";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  const actor = await resolveCategoryActor("categories.create");
  if (!actor.success) {
    return (
      <AuthError
        code={actor.error.code === "UNAUTHORIZED" ? "session_expired" : "forbidden"}
      />
    );
  }

  return (
    <PageContainer
      title="New category"
      description="Create a menu category for your restaurant."
    >
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <CategoryForm mode="create" />
      </div>
    </PageContainer>
  );
}
