import { KITCHEN_BOARD_COLUMNS } from "@/types/kitchen";
import type { KitchenBoardColumn } from "@/types/kitchen";
import type { OrderSelectOption, RestaurantOrderStatus } from "@/types/order";

export { KITCHEN_BOARD_COLUMNS };

export const KITCHEN_BOARD_COLUMN_LABELS: Record<KitchenBoardColumn, string> = {
  new: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
};

export const KITCHEN_STATUS_TO_COLUMN: Record<
  RestaurantOrderStatus,
  KitchenBoardColumn | null
> = {
  pending: "new",
  confirmed: "accepted",
  preparing: "preparing",
  ready: "ready",
  served: null,
  completed: null,
  cancelled: null,
};

export const KITCHEN_URGENCY_THRESHOLDS = {
  warningMinutes: 10,
  criticalMinutes: 20,
} as const;

export const KITCHEN_STORAGE_KEYS = {
  soundMuted: "dineflow_kds_muted",
  displayDensity: "dineflow_kds_density",
} as const;

export const KITCHEN_VALID_TRANSITIONS: Record<
  RestaurantOrderStatus,
  readonly RestaurantOrderStatus[]
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "cancelled"],
  served: [],
  completed: [],
  cancelled: [],
} as const;

/** Chef assignment placeholders until staff assignment exists */
export const CHEF_OPTIONS: OrderSelectOption[] = [
  { value: "67a000000000000000000301", label: "Chef Amina" },
  { value: "67a000000000000000000302", label: "Chef Ravi" },
  { value: "67a000000000000000000303", label: "Chef Lucia" },
];

export function getChefLabel(chefId: string | null | undefined): string | null {
  if (!chefId) return null;
  return CHEF_OPTIONS.find((chef) => chef.value === chefId)?.label ?? null;
}
