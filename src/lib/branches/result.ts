import type {
  BranchActionError,
  BranchActionErrorCode,
  BranchActionResult,
} from "@/types/branch";

export function branchSuccess<T>(data: T): BranchActionResult<T> {
  return { success: true, data };
}

export function branchFailure(
  code: BranchActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): BranchActionResult<never> {
  const error: BranchActionError = { code, message, fieldErrors };
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
