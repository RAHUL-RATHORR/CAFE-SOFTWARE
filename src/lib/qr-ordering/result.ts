import type {
  QrOrderingActionError,
  QrOrderingActionErrorCode,
  QrOrderingActionResult,
} from "@/types/qr-ordering";

export function qrSuccess<T>(data: T): QrOrderingActionResult<T> {
  return { success: true, data };
}

export function qrFailure(
  code: QrOrderingActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): QrOrderingActionResult<never> {
  const error: QrOrderingActionError = { code, message, fieldErrors };
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

export function createToken(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function computeGuestTotals(
  items: Array<{ price: number; quantity: number }>
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = 0; // FUTURE PLACEHOLDER
  const serviceCharge = 0; // FUTURE PLACEHOLDER
  const grandTotal = Math.max(0, subtotal + tax + serviceCharge);
  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax,
    serviceCharge,
    grandTotal: Number(grandTotal.toFixed(2)),
  };
}
