import type {
  OrderPriority,
  OrderType,
  RestaurantOrder,
  RestaurantOrderStatus,
} from "@/types/order";

export const KITCHEN_BOARD_COLUMNS = [
  "new",
  "accepted",
  "preparing",
  "ready",
] as const;

export type KitchenBoardColumn = (typeof KITCHEN_BOARD_COLUMNS)[number];

export type KitchenUrgencyLevel = "normal" | "warning" | "critical";

export type KitchenTicket = RestaurantOrder & {
  elapsedMs: number;
  elapsedLabel: string;
  itemCount: number;
  boardColumn: KitchenBoardColumn;
  urgencyLevel: KitchenUrgencyLevel;
};

export type KitchenSummary = {
  waiting: number;
  preparing: number;
  ready: number;
  completedToday: number;
  averagePreparationMinutes: number | null;
};

export type KitchenBoard = Record<KitchenBoardColumn, KitchenTicket[]>;

export type KitchenDashboardData = {
  summary: KitchenSummary;
  board: KitchenBoard;
  tickets: KitchenTicket[];
  activeBranchId?: string | null;
};

export type KitchenBranchOption = {
  id: string;
  name: string;
  branchCode: string;
  isMainBranch?: boolean;
};

export type KitchenFilterOptions = {
  tables: Array<{ value: string; label: string }>;
  chefs: Array<{ value: string; label: string }>;
  branches: KitchenBranchOption[];
  canSwitchBranch: boolean;
};

export type KitchenActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "INVALID_TRANSITION"
  | "CONFLICT"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

export type KitchenActionError = {
  code: KitchenActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type KitchenActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: KitchenActionError };

export type KitchenStatusTarget = RestaurantOrderStatus;
export type KitchenPriority = OrderPriority;
export type KitchenOrderType = OrderType;

export type KitchenRealtimeEventType =
  | "NEW_ORDER"
  | "ORDER_UPDATED"
  | "ORDER_CANCELLED";

export type KitchenRealtimePayload = {
  type: KitchenRealtimeEventType;
  restaurantId: string;
  branchId?: string | null;
  orderId: string;
  orderNumber: string;
  status: RestaurantOrderStatus;
  timestamp: string;
  order?: RestaurantOrder;
};
