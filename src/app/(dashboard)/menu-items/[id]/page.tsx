import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { MenuItemDetails } from "@/components/menu-items";
import { AuthError } from "@/components/auth/auth-error";
import { getMenuItemById } from "@/actions/menu-items";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MenuItemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getMenuItemById(id);

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
      <PageContainer title="Menu item">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Menu item details"
      description="View pricing, availability, and category assignment."
    >
      <MenuItemDetails item={result.data} />
    </PageContainer>
  );
}
