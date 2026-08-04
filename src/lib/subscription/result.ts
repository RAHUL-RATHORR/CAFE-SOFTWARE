import type {
  SubscriptionActionError,
  SubscriptionActionErrorCode,
  SubscriptionActionResult,
} from "@/types/subscription";

export function subscriptionSuccess<T>(
  data: T
): SubscriptionActionResult<T> {
  return { success: true, data };
}

export function subscriptionFailure(
  code: SubscriptionActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): SubscriptionActionResult<never> {
  const error: SubscriptionActionError = { code, message, fieldErrors };
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
