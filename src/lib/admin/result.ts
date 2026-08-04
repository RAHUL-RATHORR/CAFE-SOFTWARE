import type {
  AdminActionError,
  AdminActionErrorCode,
  AdminActionResult,
} from "@/types/admin";

export function adminSuccess<T>(data: T): AdminActionResult<T> {
  return { success: true, data };
}

export function adminFailure(
  code: AdminActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): AdminActionResult<never> {
  const error: AdminActionError = { code, message, fieldErrors };
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

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatAdminMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export { idToString, toIso };
