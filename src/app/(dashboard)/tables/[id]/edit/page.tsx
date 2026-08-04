import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { RestaurantTableForm } from "@/components/restaurant-tables";
import { AuthError } from "@/components/auth/auth-error";
import { getTableById } from "@/actions/tables";
import { resolveRestaurantTableActor } from "@/actions/tables/context";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTablePage({ params }: PageProps) {
  const actor = await resolveRestaurantTableActor([
    "tables.edit",
    "tables.manage",
  ]);
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
  const result = await getTableById(id);

  if (!result.success) {
    if (result.error.code === "NOT_FOUND") notFound();
    return (
      <PageContainer title="Edit table">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit table"
      description={`Update “${result.data.tableName}”.`}
    >
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <RestaurantTableForm mode="edit" table={result.data} />
      </div>
    </PageContainer>
  );
}
