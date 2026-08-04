"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { DsBadge } from "@/components/badges/ds-badge";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { PurchaseTimeline } from "@/components/purchases/purchase-timeline";
import {
  deletePurchaseOrder,
  updatePurchaseStatus,
} from "@/actions/purchases";
import {
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUS_VARIANTS,
  isPurchaseEditable,
} from "@/config/purchases";
import { INVENTORY_UNIT_LABELS } from "@/config/inventory";
import {
  buildInventoryUpdatePlaceholders,
  formatPurchaseDate,
  formatPurchaseDateTime,
  formatPurchaseMoney,
} from "@/lib/purchases";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { PurchaseOrder, PurchaseStatus } from "@/types/purchase";

type PurchaseOrderDetailsProps = {
  purchase: PurchaseOrder;
};

export function PurchaseOrderDetails({ purchase }: PurchaseOrderDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusValue, setStatusValue] = useState<PurchaseStatus>(
    purchase.status
  );

  const canEdit = useHasPermission(["purchases.edit", "purchases.manage"]);
  const canDelete = useHasPermission([
    "purchases.delete",
    "purchases.manage",
  ]);
  const canApprove = useHasPermission([
    "purchases.approve",
    "purchases.manage",
  ]);

  const inventoryPlaceholders = buildInventoryUpdatePlaceholders(purchase);

  function handleDelete() {
    openConfirmDialog("delete", {
      title: `Delete “${purchase.purchaseNumber}”?`,
      description: "This purchase order will be cancelled and soft-deleted.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const result = await deletePurchaseOrder({ id: purchase.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Purchase deleted", purchase.purchaseNumber);
        router.push("/purchases");
        router.refresh();
      },
    });
  }

  function handleStatusChange(next: PurchaseStatus) {
    setStatusValue(next);
    startTransition(async () => {
      const result = await updatePurchaseStatus({
        id: purchase.id,
        status: next,
      });
      if (!result.success) {
        setStatusValue(purchase.status);
        toast.error(result.error.message);
        return;
      }
      toast.success(
        "Status updated",
        PURCHASE_STATUS_LABELS[result.data.status]
      );
      router.refresh();
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <AppCard
          title={purchase.purchaseNumber}
          description={purchase.vendorName ?? "No vendor"}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <DsBadge
                variant={PURCHASE_STATUS_VARIANTS[purchase.status]}
                size="sm"
              >
                {PURCHASE_STATUS_LABELS[purchase.status]}
              </DsBadge>
              {canEdit.allowed && isPurchaseEditable(purchase.status) ? (
                <Link
                  href={`/purchases/${purchase.id}/edit`}
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
            <DetailItem
              label="Expected delivery"
              value={formatPurchaseDate(purchase.expectedDelivery)}
            />
            <DetailItem
              label="Received date"
              value={formatPurchaseDate(purchase.receivedDate)}
            />
            <DetailItem
              label="Created"
              value={formatPurchaseDateTime(purchase.createdAt)}
            />
            <DetailItem
              label="Updated"
              value={formatPurchaseDateTime(purchase.updatedAt)}
            />
            {purchase.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Notes</dt>
                <dd className="mt-1 text-sm leading-relaxed">{purchase.notes}</dd>
              </div>
            ) : null}
          </dl>

          {(canEdit.allowed || canApprove.allowed) &&
          purchase.status !== "cancelled" ? (
            <div className="mt-6 space-y-1.5 border-t border-border/60 pt-4">
              <label
                htmlFor="purchase-status"
                className="text-xs text-muted-foreground"
              >
                Update status
              </label>
              <select
                id="purchase-status"
                value={statusValue}
                disabled={isPending}
                className="flex h-10 w-full max-w-xs rounded-xl border border-border bg-background px-3 text-sm"
                onChange={(event) =>
                  handleStatusChange(event.target.value as PurchaseStatus)
                }
              >
                {(Object.keys(PURCHASE_STATUS_LABELS) as PurchaseStatus[]).map(
                  (status) => (
                    <option key={status} value={status}>
                      {PURCHASE_STATUS_LABELS[status]}
                    </option>
                  )
                )}
              </select>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-4">
            <Link
              href="/purchases"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-xl"
              )}
            >
              Back to list
            </Link>
            {canDelete.allowed ? (
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                onClick={handleDelete}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            ) : null}
          </div>
        </AppCard>

        <AppCard title="Line items" description="Purchase history lines">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Item</th>
                  <th className="py-2 pr-3 font-medium">Qty</th>
                  <th className="py-2 pr-3 font-medium">Unit</th>
                  <th className="py-2 pr-3 font-medium">Price</th>
                  <th className="py-2 pr-3 font-medium">Received</th>
                  <th className="py-2 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item, index) => (
                  <tr
                    key={`${item.name}-${index}`}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="py-2.5 pr-3 font-medium">{item.name}</td>
                    <td className="py-2.5 pr-3">{item.quantity}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {INVENTORY_UNIT_LABELS[item.unit]}
                    </td>
                    <td className="py-2.5 pr-3">
                      {formatPurchaseMoney(item.unitPrice)}
                    </td>
                    <td className="py-2.5 pr-3">{item.quantityReceived}</td>
                    <td className="py-2.5 text-right tabular-nums">
                      {formatPurchaseMoney(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-4 grid gap-2 border-t border-border/60 pt-4 text-sm sm:grid-cols-2">
            <DetailItem
              label="Subtotal"
              value={formatPurchaseMoney(purchase.subtotal)}
            />
            <DetailItem
              label="Discount"
              value={formatPurchaseMoney(purchase.discount)}
            />
            <DetailItem
              label="Tax"
              value={formatPurchaseMoney(purchase.tax)}
            />
            <DetailItem
              label="Shipping"
              value={formatPurchaseMoney(purchase.shippingCost)}
            />
            <DetailItem
              label="Grand total"
              value={formatPurchaseMoney(purchase.grandTotal)}
            />
          </dl>
        </AppCard>
      </div>

      <div className="space-y-4">
        <AppCard
          title="Goods receipt"
          description="Foundation only — inventory not updated yet"
        >
          <dl className="grid gap-3">
            <DetailItem
              label="GRN number"
              value={purchase.goodsReceipt.grnNumber ?? "Not generated"}
              mono
            />
            <DetailItem
              label="Quality check"
              value={purchase.goodsReceipt.qualityCheckStatus}
            />
            <DetailItem
              label="Inventory update"
              value={
                purchase.goodsReceipt.inventoryUpdatePending
                  ? "Pending (placeholder)"
                  : "Not queued"
              }
            />
            <DetailItem
              label="Received notes"
              value={purchase.goodsReceipt.receivedNotes || "—"}
            />
          </dl>
          <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
            Partial receipt, quality check, GRN numbering, and automatic stock
            updates are reserved for the Inventory module. Prepared placeholders:{" "}
            {inventoryPlaceholders.length} line
            {inventoryPlaceholders.length === 1 ? "" : "s"}.
          </div>
        </AppCard>

        <AppCard title="Status timeline">
          <PurchaseTimeline
            status={purchase.status}
            history={purchase.statusHistory}
            createdAt={purchase.createdAt}
          />
        </AppCard>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value: string;
  mono?: boolean;
  children?: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-sm font-medium",
          mono && "font-mono text-xs text-muted-foreground"
        )}
      >
        {children ?? value}
      </dd>
    </div>
  );
}
