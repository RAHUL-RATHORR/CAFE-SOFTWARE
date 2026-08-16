/**
 * License validation foundation — local checks only (no external APIs).
 */

import {
  getSubscriptionPeriodEnd,
  resolveEffectiveStatus,
} from "@/lib/subscription/lifecycle";
import { daysRemaining } from "@/lib/subscription/dates";
import type {
  LicenseValidationResult,
  RestaurantSubscription,
} from "@/types/subscription";

export function validateLicense(
  subscription: RestaurantSubscription | null,
  now: Date = new Date()
): LicenseValidationResult {
  if (!subscription) {
    return {
      valid: false,
      status: "missing",
      effectiveStatus: "missing",
      licenseKey: null,
      daysRemaining: null,
      reason: "No subscription found for this restaurant.",
    };
  }

  if (!subscription.licenseKey?.trim()) {
    return {
      valid: false,
      status: subscription.status,
      effectiveStatus: resolveEffectiveStatus(subscription, now),
      licenseKey: null,
      daysRemaining: null,
      reason: "License key is missing.",
    };
  }

  const effectiveStatus = resolveEffectiveStatus(subscription, now);
  const periodEnd = getSubscriptionPeriodEnd(subscription);
  const remaining = daysRemaining(periodEnd, now);

  if (
    effectiveStatus === "expired" ||
    effectiveStatus === "cancelled" ||
    effectiveStatus === "suspended"
  ) {
    return {
      valid: false,
      status: subscription.status,
      effectiveStatus,
      licenseKey: subscription.licenseKey,
      daysRemaining: 0,
      reason: `Subscription is ${effectiveStatus}.`,
    };
  }

  const valid =
    effectiveStatus === "trialing" ||
    effectiveStatus === "active" ||
    effectiveStatus === "grace_period";

  return {
    valid,
    status: subscription.status,
    effectiveStatus,
    licenseKey: subscription.licenseKey,
    daysRemaining: remaining,
    reason: valid
      ? effectiveStatus === "grace_period"
        ? "License is valid during grace period."
        : "License is valid."
      : `Subscription status is ${effectiveStatus}.`,
  };
}
