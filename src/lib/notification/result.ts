import type {
  NotificationActionError,
  NotificationActionErrorCode,
  NotificationActionResult,
} from "@/types/notification";

export function notificationSuccess<T>(
  data: T
): NotificationActionResult<T> {
  return { success: true, data };
}

export function notificationFailure(
  code: NotificationActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): NotificationActionResult<never> {
  const error: NotificationActionError = { code, message, fieldErrors };
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
