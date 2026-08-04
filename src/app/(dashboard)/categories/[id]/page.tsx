import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { CategoryDetails } from "@/components/categories";
import { AuthError } from "@/components/auth/auth-error";
import { getCategoryById } from "@/actions/categories";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CategoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getCategoryById(id);

  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED") {
      return <AuthError code="session_expired" />;
    }
    if (result.error.code === "FORBIDDEN") {
      return <AuthError code="forbidden" />;
    }
    if (result.error.code === "NOT_FOUND") {
      notFound();
    }
    return (
      <PageContainer title="Category">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Category details"
      description="View category information and manage status."
    >
      <CategoryDetails category={result.data} />
    </PageContainer>
  );
}
