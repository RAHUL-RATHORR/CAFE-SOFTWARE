import type {
  MenuItemActionError,
  MenuItemActionErrorCode,
  MenuItemActionResult,
} from "@/types/menu-item";

export function menuItemSuccess<T>(data: T): MenuItemActionResult<T> {
  return { success: true, data };
}

export function menuItemFailure(
  code: MenuItemActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): MenuItemActionResult<never> {
  const error: MenuItemActionError = { code, message, fieldErrors };
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
