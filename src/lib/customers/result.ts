import type {
  CustomerActionError,
  CustomerActionErrorCode,
  CustomerActionResult,
} from "@/types/customer";

export function customerSuccess<T>(data: T): CustomerActionResult<T> {
  return { success: true, data };
}

export function customerFailure(
  code: CustomerActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): CustomerActionResult<never> {
  const error: CustomerActionError = { code, message, fieldErrors };
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
