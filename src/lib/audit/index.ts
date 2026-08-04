import { adminRepository } from "@/repositories/admin";
import { maskSensitiveData } from "@/lib/security";
import { logger } from "@/lib/logger";
import type { AuditChangePayload } from "@/types/production";
import type { AdminAuditLog } from "@/types/admin";

/**
 * Audit improvement helpers — wraps platform audit with change/IP/device placeholders.
 */
export async function recordAuditChange(
  payload: AuditChangePayload
): Promise<AdminAuditLog | null> {
  try {
    const metadata = maskSensitiveData({
      ...(payload.metadata ?? {}),
      oldValuePlaceholder: payload.oldValuePlaceholder ?? null,
      newValuePlaceholder: payload.newValuePlaceholder ?? null,
      ipPlaceholder: payload.ipPlaceholder ?? null,
      devicePlaceholder: payload.devicePlaceholder ?? null,
      entity: payload.entity,
      entityId: payload.entityId ?? null,
      timestamp: new Date().toISOString(),
    });

    return await adminRepository.writeAudit({
      category: payload.category ?? "system",
      action: payload.action,
      message:
        payload.message ??
        `${payload.action} on ${payload.entity}${
          payload.entityId ? ` (${payload.entityId})` : ""
        }`,
      actorId: payload.userId ?? null,
      actorEmail: payload.userEmail ?? null,
      restaurantId: payload.restaurantId ?? null,
      restaurantName: payload.restaurantName ?? null,
      targetType: payload.entity,
      targetId: payload.entityId ?? null,
      metadata,
    });
  } catch (error) {
    logger.error(
      "Failed to persist audit change",
      { operation: "audit.recordAuditChange", entity: payload.entity },
      error
    );
    return null;
  }
}

export function buildAuditMetadata(input: {
  oldValuePlaceholder?: unknown;
  newValuePlaceholder?: unknown;
  ipPlaceholder?: string | null;
  devicePlaceholder?: string | null;
  extra?: Record<string, unknown>;
}): Record<string, unknown> {
  return maskSensitiveData({
    ...(input.extra ?? {}),
    oldValuePlaceholder: input.oldValuePlaceholder ?? null,
    newValuePlaceholder: input.newValuePlaceholder ?? null,
    ipPlaceholder: input.ipPlaceholder ?? null,
    devicePlaceholder: input.devicePlaceholder ?? null,
  });
}
