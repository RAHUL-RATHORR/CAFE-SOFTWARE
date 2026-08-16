"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import {
  subscriptionFailure,
  subscriptionSuccess,
  zodFieldErrors,
  validateLicense,
  evaluateTenantLimits,
  planToLimits,
} from "@/lib/subscription";
import {
  assignPlanSchema,
  cancelSubscriptionSchema,
  changePlanSchema,
  createPlanSchema,
  deletePlanSchema,
  renewSubscriptionSchema,
  reverseCancellationSchema,
  searchPlansSchema,
  updatePlanSchema,
} from "@/lib/validators/subscription";
import { subscriptionRepository } from "@/repositories/subscription";
import { resolveSubscriptionActor } from "@/actions/subscription/context";
import type {
  FeatureAccess,
  InvoiceFoundation,
  LicenseValidationResult,
  LimitCheckResult,
  RestaurantSubscription,
  SubscriptionActionResult,
  SubscriptionDashboardSummary,
  SubscriptionPlanEntity,
  UsageMetrics,
} from "@/types/subscription";

function mapDbError(error: unknown): SubscriptionActionResult<never> {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "DUPLICATE_PLAN"
  ) {
    return subscriptionFailure(
      "DUPLICATE_PLAN",
      "A plan with this slug already exists.",
      { slug: ["This slug is already in use."] }
    );
  }
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "NOT_FOUND"
  ) {
    return subscriptionFailure("NOT_FOUND", "Plan not found.");
  }
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "NO_SUBSCRIPTION"
  ) {
    return subscriptionFailure(
      "NO_SUBSCRIPTION",
      "No subscription found for this restaurant."
    );
  }
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "DOWNGRADE_EXCEEDS_LIMITS"
  ) {
    const details =
      "details" in error
        ? (error as { details?: Record<string, unknown> }).details
        : undefined;
    return subscriptionFailure(
      "DOWNGRADE_EXCEEDS_LIMITS",
      "Your current usage exceeds the limits of this plan.",
      undefined,
      details
    );
  }
  if (isDatabaseError(error)) {
    return subscriptionFailure("DATABASE_ERROR", error.message);
  }
  return subscriptionFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong. Please try again."
  );
}

function revalidateSubscriptionPaths() {
  revalidatePath("/subscription");
  revalidatePath("/subscription/plans");
  revalidatePath("/subscription/billing");
  revalidatePath("/subscription/usage");
  revalidatePath("/subscription/history");
  revalidatePath("/settings");
}

export async function createPlan(
  input: unknown
): Promise<SubscriptionActionResult<SubscriptionPlanEntity>> {
  const actor = await resolveSubscriptionActor([
    "plans.manage",
    "subscription.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = createPlanSchema.safeParse(input);
  if (!parsed.success) {
    return subscriptionFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const plan = await subscriptionRepository.createPlan({
      ...parsed.data,
      createdBy: actor.data.userId,
    });
    revalidateSubscriptionPaths();
    return subscriptionSuccess(plan);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updatePlan(
  input: unknown
): Promise<SubscriptionActionResult<SubscriptionPlanEntity>> {
  const actor = await resolveSubscriptionActor([
    "plans.manage",
    "subscription.manage",
    "subscription.update",
  ]);
  if (!actor.success) return actor;

  const parsed = updatePlanSchema.safeParse(input);
  if (!parsed.success) {
    return subscriptionFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const { id, ...rest } = parsed.data;
  try {
    const plan = await subscriptionRepository.updatePlan(id, {
      ...rest,
      updatedBy: actor.data.userId,
    });
    if (!plan) return subscriptionFailure("NOT_FOUND", "Plan not found.");
    revalidateSubscriptionPaths();
    return subscriptionSuccess(plan);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function deletePlan(
  input: unknown
): Promise<SubscriptionActionResult<{ id: string }>> {
  const actor = await resolveSubscriptionActor([
    "plans.manage",
    "subscription.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = deletePlanSchema.safeParse(input);
  if (!parsed.success) {
    return subscriptionFailure(
      "VALIDATION_ERROR",
      "Invalid plan id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const plan = await subscriptionRepository.softDeletePlan(
      parsed.data.id,
      actor.data.userId
    );
    if (!plan) return subscriptionFailure("NOT_FOUND", "Plan not found.");
    revalidateSubscriptionPaths();
    return subscriptionSuccess({ id: plan.id });
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getPlans(
  input: unknown = {}
): Promise<SubscriptionActionResult<SubscriptionPlanEntity[]>> {
  const actor = await resolveSubscriptionActor([
    "subscription.view",
    "subscription.manage",
    "plans.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = searchPlansSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return subscriptionFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const plans = await subscriptionRepository.findPlans(parsed.data);
    return subscriptionSuccess(plans);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function assignPlan(
  input: unknown
): Promise<SubscriptionActionResult<RestaurantSubscription>> {
  const actor = await resolveSubscriptionActor([
    "subscription.manage",
    "subscription.update",
    "plans.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = assignPlanSchema.safeParse(input);
  if (!parsed.success) {
    return subscriptionFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const subscription = await subscriptionRepository.assignPlan({
      restaurantId: actor.data.restaurantId,
      planId: parsed.data.planId,
      billingCycle: parsed.data.billingCycle,
      startTrial: parsed.data.startTrial,
      userId: actor.data.userId,
    });
    revalidateSubscriptionPaths();
    return subscriptionSuccess(subscription);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function upgradePlan(
  input: unknown
): Promise<SubscriptionActionResult<RestaurantSubscription>> {
  const actor = await resolveSubscriptionActor([
    "subscription.manage",
    "subscription.update",
  ]);
  if (!actor.success) return actor;

  const parsed = changePlanSchema.safeParse(input);
  if (!parsed.success) {
    return subscriptionFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const subscription = await subscriptionRepository.changePlan({
      restaurantId: actor.data.restaurantId,
      planId: parsed.data.planId,
      billingCycle: parsed.data.billingCycle,
      mode: "upgrade",
      userId: actor.data.userId,
      acknowledgeDowngradeLimits: parsed.data.acknowledgeDowngradeLimits,
      scheduleAtPeriodEnd: parsed.data.scheduleAtPeriodEnd,
    });
    revalidateSubscriptionPaths();
    return subscriptionSuccess(subscription);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function downgradePlan(
  input: unknown
): Promise<SubscriptionActionResult<RestaurantSubscription>> {
  const actor = await resolveSubscriptionActor([
    "subscription.manage",
    "subscription.update",
  ]);
  if (!actor.success) return actor;

  const parsed = changePlanSchema.safeParse(input);
  if (!parsed.success) {
    return subscriptionFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const subscription = await subscriptionRepository.changePlan({
      restaurantId: actor.data.restaurantId,
      planId: parsed.data.planId,
      billingCycle: parsed.data.billingCycle,
      mode: "downgrade",
      userId: actor.data.userId,
      acknowledgeDowngradeLimits: parsed.data.acknowledgeDowngradeLimits,
      scheduleAtPeriodEnd: parsed.data.scheduleAtPeriodEnd,
    });
    revalidateSubscriptionPaths();
    return subscriptionSuccess(subscription);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function cancelSubscription(
  input: unknown = {}
): Promise<SubscriptionActionResult<RestaurantSubscription>> {
  const actor = await resolveSubscriptionActor([
    "subscription.manage",
    "subscription.update",
  ]);
  if (!actor.success) return actor;

  const parsed = cancelSubscriptionSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return subscriptionFailure(
      "VALIDATION_ERROR",
      "Invalid cancellation request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const subscription = await subscriptionRepository.cancelSubscription({
      restaurantId: actor.data.restaurantId,
      userId: actor.data.userId,
      cancelAtPeriodEnd: parsed.data.cancelAtPeriodEnd,
      reason: parsed.data.reason,
    });
    revalidateSubscriptionPaths();
    return subscriptionSuccess(subscription);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function reverseCancellation(
  input: unknown = {}
): Promise<SubscriptionActionResult<RestaurantSubscription>> {
  const actor = await resolveSubscriptionActor([
    "subscription.manage",
    "subscription.update",
  ]);
  if (!actor.success) return actor;

  const parsed = reverseCancellationSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return subscriptionFailure(
      "VALIDATION_ERROR",
      "Invalid request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const subscription = await subscriptionRepository.reverseCancellation({
      restaurantId: actor.data.restaurantId,
      userId: actor.data.userId,
    });
    revalidateSubscriptionPaths();
    return subscriptionSuccess(subscription);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function renewSubscription(
  input: unknown = {}
): Promise<SubscriptionActionResult<RestaurantSubscription>> {
  const actor = await resolveSubscriptionActor([
    "subscription.manage",
    "subscription.update",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = renewSubscriptionSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return subscriptionFailure(
      "VALIDATION_ERROR",
      "Invalid renewal request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const subscription = await subscriptionRepository.renewSubscription({
      restaurantId: actor.data.restaurantId,
      billingCycle: parsed.data.billingCycle,
      userId: actor.data.userId,
    });
    revalidateSubscriptionPaths();
    return subscriptionSuccess(subscription);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getUsage(): Promise<
  SubscriptionActionResult<{
    usage: UsageMetrics;
    limits: ReturnType<typeof planToLimits>;
    checks: LimitCheckResult[];
  }>
> {
  const actor = await resolveSubscriptionActor([
    "subscription.view",
    "subscription.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const [usage, dashboard] = await Promise.all([
      subscriptionRepository.getUsage(actor.data.restaurantId),
      subscriptionRepository.getDashboard(actor.data.restaurantId),
    ]);
    const limits = planToLimits(dashboard.currentPlan);
    const checks = evaluateTenantLimits({
      limits,
      usage,
      tablesUsed: usage.tables,
    });
    return subscriptionSuccess({ usage, limits, checks });
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getSubscriptionDashboard(): Promise<
  SubscriptionActionResult<SubscriptionDashboardSummary>
> {
  const actor = await resolveSubscriptionActor([
    "subscription.view",
    "subscription.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const summary = await subscriptionRepository.getDashboard(
      actor.data.restaurantId
    );
    return subscriptionSuccess(summary);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getBillingHistory(): Promise<
  SubscriptionActionResult<InvoiceFoundation[]>
> {
  const actor = await resolveSubscriptionActor([
    "subscription.view",
    "subscription.manage",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const invoices = await subscriptionRepository.listInvoices(
      actor.data.restaurantId,
      50
    );
    return subscriptionSuccess(invoices);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getCurrentSubscription(): Promise<
  SubscriptionActionResult<RestaurantSubscription | null>
> {
  const actor = await resolveSubscriptionActor([
    "subscription.view",
    "subscription.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const subscription = await subscriptionRepository.getSubscription(
      actor.data.restaurantId
    );
    return subscriptionSuccess(subscription);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getFeatureAccess(): Promise<
  SubscriptionActionResult<FeatureAccess | null>
> {
  const actor = await resolveSubscriptionActor([
    "subscription.view",
    "subscription.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const access = await subscriptionRepository.getFeatureAccess(
      actor.data.restaurantId
    );
    return subscriptionSuccess(access);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getLicenseStatus(): Promise<
  SubscriptionActionResult<LicenseValidationResult>
> {
  const actor = await resolveSubscriptionActor([
    "subscription.view",
    "subscription.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const subscription = await subscriptionRepository.getSubscription(
      actor.data.restaurantId
    );
    return subscriptionSuccess(validateLicense(subscription));
  } catch (error) {
    return mapDbError(error);
  }
}
