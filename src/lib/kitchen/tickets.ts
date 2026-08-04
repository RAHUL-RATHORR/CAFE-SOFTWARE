import { KITCHEN_STATUS_TO_COLUMN } from "@/config/kitchen";
import type {
  KitchenBoard,
  KitchenBoardColumn,
  KitchenSummary,
  KitchenTicket,
} from "@/types/kitchen";
import type { RestaurantOrder } from "@/types/order";
import { KITCHEN_BOARD_COLUMNS } from "@/types/kitchen";

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

export function toKitchenTicket(
  order: RestaurantOrder,
  now = Date.now()
): KitchenTicket | null {
  const boardColumn = KITCHEN_STATUS_TO_COLUMN[order.status];
  if (!boardColumn) return null;

  const elapsedMs = Math.max(0, now - new Date(order.createdAt).getTime());
  return {
    ...order,
    elapsedMs,
    elapsedLabel: formatElapsed(elapsedMs),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    boardColumn,
  };
}

export function emptyKitchenBoard(): KitchenBoard {
  return {
    pending: [],
    preparing: [],
    ready: [],
    completed: [],
  };
}

export function groupTicketsByBoard(tickets: KitchenTicket[]): KitchenBoard {
  const board = emptyKitchenBoard();
  for (const ticket of tickets) {
    board[ticket.boardColumn].push(ticket);
  }
  for (const column of KITCHEN_BOARD_COLUMNS) {
    board[column].sort((a, b) => {
      const priorityRank = priorityWeight(b.priority) - priorityWeight(a.priority);
      if (priorityRank !== 0) return priorityRank;
      return a.elapsedMs - b.elapsedMs < 0 ? 1 : -1;
    });
  }
  return board;
}

function priorityWeight(priority: RestaurantOrder["priority"]): number {
  switch (priority) {
    case "urgent":
      return 4;
    case "high":
      return 3;
    case "normal":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

export function buildKitchenSummary(
  tickets: KitchenTicket[],
  completedToday: number
): KitchenSummary {
  return {
    waiting: tickets.filter((ticket) => ticket.boardColumn === "pending").length,
    preparing: tickets.filter((ticket) => ticket.boardColumn === "preparing")
      .length,
    ready: tickets.filter((ticket) => ticket.boardColumn === "ready").length,
    completedToday,
    averagePreparationMinutes: null,
  };
}

export function nextKitchenStatus(
  status: RestaurantOrder["status"]
): RestaurantOrder["status"] | null {
  const flow: RestaurantOrder["status"][] = [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "served",
    "completed",
  ];
  const index = flow.indexOf(status);
  if (index < 0 || index >= flow.length - 1) return null;
  return flow[index + 1] ?? null;
}

export function columnDefaultStatus(
  column: KitchenBoardColumn
): RestaurantOrder["status"] {
  switch (column) {
    case "pending":
      return "pending";
    case "preparing":
      return "preparing";
    case "ready":
      return "ready";
    case "completed":
      return "completed";
  }
}
