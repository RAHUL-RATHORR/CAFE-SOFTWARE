import type {
  KitchenActionError,
  KitchenActionErrorCode,
  KitchenActionResult,
} from "@/types/kitchen";

export function kitchenSuccess<T>(data: T): KitchenActionResult<T> {
  return { success: true, data };
}

export function kitchenFailure(
  code: KitchenActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): KitchenActionResult<never> {
  const error: KitchenActionError = { code, message, fieldErrors };
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
