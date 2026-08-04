import type { VendorStatus } from "@/types/vendor";

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  blocked: "Blocked",
};

export const VENDOR_STATUS_VARIANTS: Record<
  VendorStatus,
  "success" | "secondary" | "danger"
> = {
  active: "success",
  inactive: "secondary",
  blocked: "danger",
};
