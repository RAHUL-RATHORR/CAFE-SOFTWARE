import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { OrderForm } from "@/components/orders";
import { AuthError } from "@/components/auth/auth-error";
import { getOrder, getOrderFormOptions } from "@/actions/orders";
import { resolveOrderActor } from "@/actions/orders/context";
import { CUSTOMER_OPTIONS, isOrderEditable } from "@/config/orders";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditOrderPage({ params }: PageProps) {
  const actor = await resolveOrderActor(["orders.edit", "orders.manage"]);
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
  const [result, options] = await Promise.all([
    getOrder(id),
    getOrderFormOptions(),
  ]);

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
      <PageContainer title="Edit order">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit order"
      description={
        isOrderEditable(result.data.status)
          ? "Update order details before completion."
          : "This order is locked and cannot be changed."
      }
    >
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <OrderForm
          mode="edit"
          order={result.data}
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
