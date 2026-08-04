import { PageContainer } from "@/components/common/page-container";
import { RestaurantTableForm } from "@/components/restaurant-tables";
import { AuthError } from "@/components/auth/auth-error";
import { resolveRestaurantTableActor } from "@/actions/tables/context";

export const dynamic = "force-dynamic";

export default async function NewTablePage() {
  const actor = await resolveRestaurantTableActor([
    "tables.create",
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

  return (
    <PageContainer
      title="New table"
      description="Add a dining table with capacity and floor assignment."
    >
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <RestaurantTableForm mode="create" />
      </div>
    </PageContainer>
  );
}
