import type {
  OrderPriority,
  OrderType,
  RestaurantOrder,
  RestaurantOrderStatus,
} from "@/types/order";

export const KITCHEN_BOARD_COLUMNS = [
  "pending",
  "preparing",
  "ready",
  "completed",
] as const;

export type KitchenBoardColumn = (typeof KITCHEN_BOARD_COLUMNS)[number];

export type KitchenTicket = RestaurantOrder & {
  elapsedMs: number;
  elapsedLabel: string;
  itemCount: number;
  boardColumn: KitchenBoardColumn;
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
};

export type KitchenFilterOptions = {
  tables: Array<{ value: string; label: string }>;
  chefs: Array<{ value: string; label: string }>;
};

export type KitchenActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
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
