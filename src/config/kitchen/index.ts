import type { KitchenBoardColumn } from "@/types/kitchen";
import type { OrderSelectOption, RestaurantOrderStatus } from "@/types/order";

export const KITCHEN_BOARD_COLUMN_LABELS: Record<KitchenBoardColumn, string> = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
};

export const KITCHEN_STATUS_TO_COLUMN: Record<
  RestaurantOrderStatus,
  KitchenBoardColumn | null
> = {
  pending: "pending",
  confirmed: "pending",
  preparing: "preparing",
  ready: "ready",
  served: "completed",
  completed: "completed",
  cancelled: null,
};

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
