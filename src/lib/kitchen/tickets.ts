import {
  KITCHEN_STATUS_TO_COLUMN,
  KITCHEN_URGENCY_THRESHOLDS,
  KITCHEN_VALID_TRANSITIONS,
} from "@/config/kitchen";
import type {
  KitchenBoard,
  KitchenBoardColumn,
  KitchenSummary,
  KitchenTicket,
  KitchenUrgencyLevel,
} from "@/types/kitchen";
import type { RestaurantOrder, RestaurantOrderStatus } from "@/types/order";
import { KITCHEN_BOARD_COLUMNS } from "@/types/kitchen";

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }
  const minPad = minutes.toString().padStart(2, "0");
  const secPad = seconds.toString().padStart(2, "0");
  return `${minPad}:${secPad}`;
}

export function calculateUrgency(elapsedMs: number): KitchenUrgencyLevel {
  const elapsedMinutes = elapsedMs / (1000 * 60);
  if (elapsedMinutes >= KITCHEN_URGENCY_THRESHOLDS.criticalMinutes) {
    return "critical";
  }
  if (elapsedMinutes >= KITCHEN_URGENCY_THRESHOLDS.warningMinutes) {
    return "warning";
  }
  return "normal";
}

export function isValidStatusTransition(
  current: RestaurantOrderStatus,
  next: RestaurantOrderStatus
): boolean {
  if (current === next) return true;
  const allowed = KITCHEN_VALID_TRANSITIONS[current] ?? [];
  return allowed.includes(next);
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
    urgencyLevel: calculateUrgency(elapsedMs),
  };
}

export function emptyKitchenBoard(): KitchenBoard {
  return {
    new: [],
    accepted: [],
    preparing: [],
    ready: [],
  };
}

export function groupTicketsByBoard(tickets: KitchenTicket[]): KitchenBoard {
  const board = emptyKitchenBoard();
  for (const ticket of tickets) {
    if (board[ticket.boardColumn]) {
      board[ticket.boardColumn].push(ticket);
    }
  }
  for (const column of KITCHEN_BOARD_COLUMNS) {
    board[column].sort((a, b) => {
      const priorityRank = priorityWeight(b.priority) - priorityWeight(a.priority);
      if (priorityRank !== 0) return priorityRank;
      // Oldest waiting order first (larger elapsedMs first)
      return b.elapsedMs - a.elapsedMs;
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
    waiting: tickets.filter(
      (ticket) => ticket.boardColumn === "new" || ticket.boardColumn === "accepted"
    ).length,
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
  switch (status) {
    case "pending":
      return "confirmed";
    case "confirmed":
      return "preparing";
    case "preparing":
      return "ready";
    case "ready":
      return "served";
    default:
      return null;
  }
}

export function columnDefaultStatus(
  column: KitchenBoardColumn
): RestaurantOrder["status"] {
  switch (column) {
    case "new":
      return "pending";
    case "accepted":
      return "confirmed";
    case "preparing":
      return "preparing";
    case "ready":
      return "ready";
  }
}
