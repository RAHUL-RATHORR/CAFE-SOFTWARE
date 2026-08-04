import type {
  BillingActionError,
  BillingActionErrorCode,
  BillingActionResult,
} from "@/types/billing";

export function billingSuccess<T>(data: T): BillingActionResult<T> {
  return { success: true, data };
}

export function billingFailure(
  code: BillingActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): BillingActionResult<never> {
  const error: BillingActionError = { code, message, fieldErrors };
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
