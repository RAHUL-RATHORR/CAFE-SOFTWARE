import type {
  ShiftActionError,
  ShiftActionErrorCode,
  ShiftActionResult,
} from "@/types/shift";
import type { ShiftDocument } from "@/models/shift";
import type { Shift, ShiftStatus, WeekDay } from "@/types/shift";

export function shiftSuccess<T>(data: T): ShiftActionResult<T> {
  return { success: true, data };
}

export function shiftFailure(
  code: ShiftActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): ShiftActionResult<never> {
  const error: ShiftActionError = { code, message, fieldErrors };
  return { success: false, error };
}

export function zodFieldErrors(
  issues: Array<{ path: PropertyKey[]; message: string }>
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "root";
    fieldErrors[key] = fieldErrors[key] ?? [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

function idToString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

function toIsoDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function serializeShift(
  doc: ShiftDocument,
  employeeName?: string | null
): Shift {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId),
    employeeId: idToString(doc.employeeId),
    employeeName: employeeName ?? null,
    shiftName: doc.shiftName,
    startTime: doc.startTime,
    endTime: doc.endTime,
    breakDuration: Number(doc.breakDuration ?? 0),
    workingHours: Number(doc.workingHours ?? 0),
    weekDays: ((doc.weekDays ?? []) as WeekDay[]).map(String) as WeekDay[],
    status: (doc.status ?? "scheduled") as ShiftStatus,
    notes: doc.notes ?? "",
    createdBy: idToString(doc.createdBy),
    updatedBy: idToString(doc.updatedBy),
    createdAt: toIsoDate(doc.createdAt) ?? "",
    updatedAt: toIsoDate(doc.updatedAt) ?? "",
  };
}
