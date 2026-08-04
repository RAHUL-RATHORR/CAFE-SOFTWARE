import type { CustomerStatus } from "@/types/customer";

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  blocked: "Blocked",
  vip: "VIP",
};

export const CUSTOMER_STATUS_VARIANTS: Record<
  CustomerStatus,
  "success" | "secondary" | "danger" | "warning"
> = {
  active: "success",
  inactive: "secondary",
  blocked: "danger",
  vip: "warning",
};

export const CUSTOMER_GENDER_LABELS = {
  female: "Female",
  male: "Male",
  "non-binary": "Non-binary",
  "prefer-not-to-say": "Prefer not to say",
  other: "Other",
} as const;

export const CUSTOMER_PREFERRED_ORDER_TYPE_LABELS = {
  "dine-in": "Dine In",
  "take-away": "Take Away",
  delivery: "Delivery",
  any: "Any",
} as const;

export const CUSTOMER_TAG_SUGGESTIONS = [
  "regular",
  "vip",
  "allergy",
  "corporate",
  "delivery",
  "birthday",
] as const;

/** FUTURE PLACEHOLDER — loyalty tiers / rewards */
export const LOYALTY_TIER_PLACEHOLDERS = [
  { id: "bronze", label: "Bronze", minPoints: 0 },
  { id: "silver", label: "Silver", minPoints: 250 },
  { id: "gold", label: "Gold", minPoints: 750 },
  { id: "platinum", label: "Platinum", minPoints: 1500 },
] as const;
