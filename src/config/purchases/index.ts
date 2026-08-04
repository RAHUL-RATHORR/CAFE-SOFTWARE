import type { PurchaseStatus } from "@/types/purchase";

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  ordered: "Ordered",
  "partially-received": "Partially Received",
  received: "Received",
  cancelled: "Cancelled",
};

export const PURCHASE_STATUS_VARIANTS: Record<
  PurchaseStatus,
  "secondary" | "warning" | "info" | "success" | "danger" | "soft" | "outline"
> = {
  draft: "secondary",
  pending: "warning",
  approved: "info",
  ordered: "soft",
  "partially-received": "outline",
  received: "success",
  cancelled: "danger",
};

export const PURCHASE_TIMELINE_STATUSES: PurchaseStatus[] = [
  "draft",
  "pending",
  "approved",
  "ordered",
  "partially-received",
  "received",
];

export function isPurchaseEditable(status: PurchaseStatus): boolean {
  return status === "draft" || status === "pending";
}
