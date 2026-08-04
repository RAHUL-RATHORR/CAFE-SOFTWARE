"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { DsBadge } from "@/components/badges/ds-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import {
  changeOrderStatus,
  deleteOrder,
  duplicateOrder,
} from "@/actions/orders";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANTS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_VARIANTS,
  isOrderEditable,
} from "@/config/orders";
import { formatOrderDate, formatOrderMoney } from "@/lib/orders";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { RestaurantOrder, RestaurantOrderStatus } from "@/types/order";
import { ORDER_STATUSES } from "@/types/order";

type OrderDetailsProps = {
  order: RestaurantOrder;
};

export function OrderDetails({ order }: OrderDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canEdit = useHasPermission(["orders.edit", "orders.manage"]);
  const canDelete = useHasPermission(["orders.delete", "orders.manage"]);
  const canCreate = useHasPermission(["orders.create", "orders.manage"]);
  const canChangeStatus = useHasPermission([
    "orders.changeStatus",
    "orders.edit",
    "orders.manage",
  ]);
  const editable = isOrderEditable(order.status);

  function handleDelete() {
    openConfirmDialog("delete", {
      title: `Delete “${order.orderNumber}”?`,
      description: "This order will be soft-deleted and hidden from the list.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const result = await deleteOrder({ id: order.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Order deleted", order.orderNumber);
        router.push("/orders");
        router.refresh();
      },
    });
  }

  function handleDuplicate() {
    startTransition(async () => {
      const result = await duplicateOrder({ id: order.id });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Order duplicated", result.data.orderNumber);
      router.push(`/orders/${result.data.id}`);
      router.refresh();
    });
  }

  function handleStatusChange(status: RestaurantOrderStatus) {
    startTransition(async () => {
      const result = await changeOrderStatus({ id: order.id, status });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Status updated", ORDER_STATUS_LABELS[result.data.status]);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="space-y-4">
        <AppCard
          title={order.orderNumber}
          description={`${ORDER_TYPE_LABELS[order.orderType]} · ${formatOrderMoney(order.grandTotal)}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <DsBadge variant={ORDER_STATUS_VARIANTS[order.status]} size="sm">
                {ORDER_STATUS_LABELS[order.status]}
              </DsBadge>
              <DsBadge
                variant={PAYMENT_STATUS_VARIANTS[order.paymentStatus]}
                size="sm"
              >
                {PAYMENT_STATUS_LABELS[order.paymentStatus]}
              </DsBadge>
              {canEdit.allowed && editable ? (
                <Link
                  href={`/orders/${order.id}/edit`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "rounded-xl"
                  )}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Link>
              ) : null}
            </div>
          }
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Customer" value={order.customerLabel ?? "—"} />
            <DetailItem label="Table" value={order.tableLabel ?? "—"} />
            <DetailItem
              label="Payment method"
              value={PAYMENT_METHOD_LABELS[order.paymentMethod]}
            />
            <DetailItem
              label="Created"
              value={formatOrderDate(order.createdAt)}
            />
            <DetailItem
              label="Updated"
              value={formatOrderDate(order.updatedAt)}
            />
            <DetailItem label="Created by" value={order.createdBy ?? "—"} mono />
            <DetailItem label="Updated by" value={order.updatedBy ?? "—"} mono />
          </dl>

          {order.notes ? (
            <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <p>{order.notes}</p>
            </div>
          ) : null}

          {order.kitchenNotes ? (
            <div className="mt-3 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Kitchen notes
              </p>
              <p>{order.kitchenNotes}</p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {canCreate.allowed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={isPending}
                onClick={handleDuplicate}
              >
                <Copy className="size-3.5" />
                Duplicate
              </Button>
            ) : null}
            {canDelete.allowed ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="rounded-xl"
                onClick={handleDelete}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            ) : null}
          </div>
        </AppCard>

        <AppCard title="Items" description="Line items and item notes">
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Price</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={`${item.menuItemId ?? item.name}-${index}`} className="border-t border-border/60">
                    <td className="px-3 py-2">
                      <p className="font-medium">{item.name}</p>
                      {item.notes ? (
                        <p className="text-xs text-muted-foreground">
                          {item.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatOrderMoney(item.price)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">
                      {formatOrderMoney(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatOrderMoney(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Discount</dt>
              <dd className="tabular-nums">{formatOrderMoney(order.discount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Tax</dt>
              <dd className="tabular-nums">{formatOrderMoney(order.tax)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Service charge</dt>
              <dd className="tabular-nums">
                {formatOrderMoney(order.serviceCharge)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-2 font-medium">
              <dt>Grand total</dt>
              <dd className="tabular-nums">
                {formatOrderMoney(order.grandTotal)}
              </dd>
            </div>
          </dl>
        </AppCard>
      </div>

      <div className="space-y-4">
        <AppCard title="Timeline" description="Order progress and status history">
          <OrderTimeline
            status={order.status}
            history={order.statusHistory}
            createdAt={order.createdAt}
          />
        </AppCard>

        {canChangeStatus.allowed ? (
          <AppCard title="Change status" description="Update workflow status">
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map((status) => (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant={order.status === status ? "secondary" : "outline"}
                  className="rounded-xl"
                  disabled={isPending || order.status === status}
                  onClick={() => handleStatusChange(status)}
                >
                  {ORDER_STATUS_LABELS[status]}
                </Button>
              ))}
            </div>
          </AppCard>
        ) : null}

        <AppCard title="Audit trail" description="Status history entries">
          {order.statusHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <ul className="space-y-3">
              {[...order.statusHistory].reverse().map((entry, index) => (
                <li
                  key={`${entry.status}-${entry.changedAt}-${index}`}
                  className="rounded-xl border border-border/70 px-3 py-2 text-sm"
                >
                  <p className="font-medium">
                    {ORDER_STATUS_LABELS[entry.status]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatOrderDate(entry.changedAt)}
                    {entry.changedBy ? ` · ${entry.changedBy}` : ""}
                  </p>
                  {entry.note ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </AppCard>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("mt-1 text-sm", mono && "font-mono text-xs")}>{value}</dd>
    </div>
  );
}
