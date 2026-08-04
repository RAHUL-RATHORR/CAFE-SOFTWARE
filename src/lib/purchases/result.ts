import type {
  PurchaseActionError,
  PurchaseActionErrorCode,
  PurchaseActionResult,
} from "@/types/purchase";

export function purchaseSuccess<T>(data: T): PurchaseActionResult<T> {
  return { success: true, data };
}

export function purchaseFailure(
  code: PurchaseActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): PurchaseActionResult<never> {
  const error: PurchaseActionError = { code, message, fieldErrors };
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
