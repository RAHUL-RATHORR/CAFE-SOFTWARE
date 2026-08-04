import { PageContainer } from "@/components/common/page-container";
import { OrderForm } from "@/components/orders";
import { AuthError } from "@/components/auth/auth-error";
import { getOrderFormOptions } from "@/actions/orders";
import { resolveOrderActor } from "@/actions/orders/context";
import { CUSTOMER_OPTIONS } from "@/config/orders";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const actor = await resolveOrderActor([
    "orders.create",
    "orders.manage",
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

  const options = await getOrderFormOptions();

  return (
    <PageContainer
      title="New order"
      description="Create a dine-in, takeaway, or delivery order."
    >
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <OrderForm
          mode="create"
          options={
            options.success
              ? options.data
              : { tables: [], customers: CUSTOMER_OPTIONS, menuItems: [] }
          }
        />
      </div>
    </PageContainer>
  );
}
