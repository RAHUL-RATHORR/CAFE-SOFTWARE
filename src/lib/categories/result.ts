import type {
  CategoryActionError,
  CategoryActionErrorCode,
  CategoryActionResult,
} from "@/types/category";

export function categorySuccess<T>(data: T): CategoryActionResult<T> {
  return { success: true, data };
}

export function categoryFailure(
  code: CategoryActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): CategoryActionResult<never> {
  const error: CategoryActionError = { code, message, fieldErrors };
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
