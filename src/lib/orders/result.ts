import type {
  OrderActionError,
  OrderActionErrorCode,
  OrderActionResult,
} from "@/types/order";

export function orderSuccess<T>(data: T): OrderActionResult<T> {
  return { success: true, data };
}

export function orderFailure(
  code: OrderActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): OrderActionResult<never> {
  const error: OrderActionError = { code, message, fieldErrors };
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
