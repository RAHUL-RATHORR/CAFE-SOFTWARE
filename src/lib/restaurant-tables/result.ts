import type {
  RestaurantTableActionError,
  RestaurantTableActionErrorCode,
  RestaurantTableActionResult,
} from "@/types/restaurant-table";

export function restaurantTableSuccess<T>(
  data: T
): RestaurantTableActionResult<T> {
  return { success: true, data };
}

export function restaurantTableFailure(
  code: RestaurantTableActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): RestaurantTableActionResult<never> {
  const error: RestaurantTableActionError = { code, message, fieldErrors };
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
