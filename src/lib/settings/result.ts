import type {
  SettingsActionError,
  SettingsActionErrorCode,
  SettingsActionResult,
} from "@/types/settings";

export function settingsSuccess<T>(data: T): SettingsActionResult<T> {
  return { success: true, data };
}

export function settingsFailure(
  code: SettingsActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): SettingsActionResult<never> {
  const error: SettingsActionError = { code, message, fieldErrors };
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
