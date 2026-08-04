/**
 * Shift scheduling domain types.
 */

export const SHIFT_STATUSES = [
  "draft",
  "scheduled",
  "in-progress",
  "completed",
  "cancelled",
] as const;

export type ShiftStatus = (typeof SHIFT_STATUSES)[number];

export const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];

export type Shift = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  employeeId: string | null;
  employeeName: string | null;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  workingHours: number;
  weekDays: WeekDay[];
  status: ShiftStatus;
  notes: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShiftListResult = {
  items: Shift[];
  meta: import("@/types/database").PaginationMeta;
};

export type ShiftSortField =
  | "shiftName"
  | "startTime"
  | "endTime"
  | "status"
  | "createdAt";

export type ShiftActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

export type ShiftActionError = {
  code: ShiftActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type ShiftActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ShiftActionError };
