/**
 * License validation foundation — local checks only (no external APIs).
 */

import type {
  LicenseValidationResult,
  RestaurantSubscription,
  SaasSubscriptionStatus,
} from "@/types/subscription";
import { daysRemaining } from "@/lib/subscription/serializers";

const ACTIVE_STATUSES: SaasSubscriptionStatus[] = ["trial", "active"];

export function validateLicense(
  subscription: RestaurantSubscription | null
): LicenseValidationResult {
  if (!subscription) {
    return {
      valid: false,
      status: "missing",
      licenseKey: null,
      daysRemaining: null,
      reason: "No subscription found for this restaurant.",
    };
  }

  if (!subscription.licenseKey?.trim()) {
    return {
      valid: false,
      status: subscription.status,
      licenseKey: null,
      daysRemaining: null,
      reason: "License key is missing.",
    };
  }

  if (subscription.status === "cancelled") {
    return {
      valid: false,
      status: subscription.status,
      licenseKey: subscription.licenseKey,
      daysRemaining: 0,
      reason: "Subscription is cancelled.",
    };
  }

  if (subscription.status === "expired" || subscription.status === "suspended") {
    return {
      valid: false,
      status: subscription.status,
      licenseKey: subscription.licenseKey,
      daysRemaining: 0,
      reason: `Subscription is ${subscription.status}.`,
    };
  }

  const end =
    subscription.status === "trial"
      ? subscription.trialEnd
      : subscription.subscriptionEnd ?? subscription.renewalDate;

  const remaining = daysRemaining(end);

  if (remaining === 0 && end) {
    return {
      valid: false,
      status: "expired",
      licenseKey: subscription.licenseKey,
      daysRemaining: 0,
      reason: "Subscription period has ended.",
    };
  }

  return {
    valid: ACTIVE_STATUSES.includes(subscription.status),
    status: subscription.status,
    licenseKey: subscription.licenseKey,
    daysRemaining: remaining,
    reason: ACTIVE_STATUSES.includes(subscription.status)
      ? "License is valid."
      : `Subscription status is ${subscription.status}.`,
  };
}
