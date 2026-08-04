import type {
  VendorActionError,
  VendorActionErrorCode,
  VendorActionResult,
} from "@/types/vendor";

export function vendorSuccess<T>(data: T): VendorActionResult<T> {
  return { success: true, data };
}

export function vendorFailure(
  code: VendorActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): VendorActionResult<never> {
  const error: VendorActionError = { code, message, fieldErrors };
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
