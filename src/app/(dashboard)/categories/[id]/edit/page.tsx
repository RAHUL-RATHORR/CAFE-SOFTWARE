import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { CategoryForm } from "@/components/categories";
import { AuthError } from "@/components/auth/auth-error";
import { getCategoryById } from "@/actions/categories";
import { resolveCategoryActor } from "@/actions/categories/context";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: PageProps) {
  const actor = await resolveCategoryActor("categories.edit");
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
  const result = await getCategoryById(id);

  if (!result.success) {
    if (result.error.code === "NOT_FOUND") notFound();
    return (
      <PageContainer title="Edit category">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit category"
      description={`Update “${result.data.name}”.`}
    >
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <CategoryForm mode="edit" category={result.data} />
      </div>
    </PageContainer>
  );
}
