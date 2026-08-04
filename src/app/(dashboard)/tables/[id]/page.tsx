import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { RestaurantTableDetails } from "@/components/restaurant-tables";
import { AuthError } from "@/components/auth/auth-error";
import { getTableById } from "@/actions/tables";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TableDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getTableById(id);

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
      <PageContainer title="Table">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Table details"
      description="View seating capacity, status, and QR placeholder."
    >
      <RestaurantTableDetails table={result.data} />
    </PageContainer>
  );
}
