import type {
  StaffActionError,
  StaffActionErrorCode,
  StaffActionResult,
} from "@/types/staff";

export function staffSuccess<T>(data: T): StaffActionResult<T> {
  return { success: true, data };
}

export function staffFailure(
  code: StaffActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): StaffActionResult<never> {
  const error: StaffActionError = { code, message, fieldErrors };
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
