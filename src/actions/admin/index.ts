"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import { adminFailure, adminSuccess, zodFieldErrors } from "@/lib/admin";
import {
  adminAssignPlanSchema,
  adminCancelSchema,
  adminChangePlanSchema,
  adminExtendTrialSchema,
  adminRenewSchema,
  adminReportKindSchema,
  adminSearchSchema,
  searchAdminUsersSchema,
  searchAuditSchema,
  searchTenantsSchema,
  toggleFeatureFlagSchema,
  updateAdminUserSchema,
  updateTenantStatusSchema,
} from "@/lib/validators/admin";
import { adminRepository } from "@/repositories/admin";
import { subscriptionRepository } from "@/repositories/subscription";
import { resolveAdminActor } from "@/actions/admin/context";
import type {
  AdminActionResult,
  AdminAuditLog,
  AdminDashboardSummary,
  AdminGlobalReport,
  AdminRevenueSummary,
  AdminSearchResult,
  AdminSystemHealth,
  AdminTenantDetail,
  AdminTenantSummary,
  AdminUserSummary,
  PlatformFeatureFlag,
} from "@/types/admin";
import type { RestaurantSubscription, SubscriptionPlanEntity } from "@/types/subscription";
import type { PaginationMeta } from "@/types/database";

function mapDbError(error: unknown): AdminActionResult<never> {
  if (isDatabaseError(error)) {
    return adminFailure("DATABASE_ERROR", error.message);
  }
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "NO_SUBSCRIPTION"
  ) {
    return adminFailure("NOT_FOUND", "No subscription found for this restaurant.");
  }
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "NOT_FOUND"
  ) {
    return adminFailure("NOT_FOUND", "Resource not found.");
  }
  return adminFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong. Please try again."
  );
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/restaurants");
  revalidatePath("/admin/users");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/plans");
  revalidatePath("/admin/revenue");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/system");
  revalidatePath("/admin/audit");
  revalidatePath("/admin/settings");
  revalidatePath("/subscription");
}

export async function getAdminDashboard(): Promise<
  AdminActionResult<AdminDashboardSummary>
> {
  const actor = await resolveAdminActor([
    "admin.dashboard",
    "admin.reports",
  ]);
  if (!actor.success) return actor;
  try {
    return adminSuccess(await adminRepository.getDashboard());
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getAdminTenants(
  input: unknown = {}
): Promise<
  AdminActionResult<{ items: AdminTenantSummary[]; meta: PaginationMeta }>
> {
  const actor = await resolveAdminActor(["admin.restaurants"]);
  if (!actor.success) return actor;
  const parsed = searchTenantsSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return adminFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }
  try {
    return adminSuccess(await adminRepository.listTenants(parsed.data));
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getAdminTenantById(
  id: string
): Promise<AdminActionResult<AdminTenantDetail>> {
  const actor = await resolveAdminActor(["admin.restaurants"]);
  if (!actor.success) return actor;
  try {
    const tenant = await adminRepository.getTenantById(id);
    if (!tenant) return adminFailure("NOT_FOUND", "Restaurant not found.");
    return adminSuccess(tenant);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateTenantStatus(
  input: unknown
): Promise<AdminActionResult<AdminTenantDetail>> {
  const actor = await resolveAdminActor(["admin.restaurants"]);
  if (!actor.success) return actor;
  const parsed = updateTenantStatusSchema.safeParse(input);
  if (!parsed.success) {
    return adminFailure(
      "VALIDATION_ERROR",
      "Invalid status update.",
      zodFieldErrors(parsed.error.issues)
    );
  }
  try {
    const tenant = await adminRepository.setTenantStatus({
      ...parsed.data,
      actorId: actor.data.userId,
      actorEmail: actor.data.email,
    });
    if (!tenant) return adminFailure("NOT_FOUND", "Restaurant not found.");
    revalidateAdmin();
    return adminSuccess(tenant);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getAdminUsers(
  input: unknown = {}
): Promise<
  AdminActionResult<{ items: AdminUserSummary[]; meta: PaginationMeta }>
> {
  const actor = await resolveAdminActor(["admin.users"]);
  if (!actor.success) return actor;
  const parsed = searchAdminUsersSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return adminFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }
  try {
    return adminSuccess(await adminRepository.listUsers(parsed.data));
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateAdminUser(
  input: unknown
): Promise<AdminActionResult<AdminUserSummary>> {
  const actor = await resolveAdminActor(["admin.users"]);
  if (!actor.success) return actor;
  const parsed = updateAdminUserSchema.safeParse(input);
  if (!parsed.success) {
    return adminFailure(
      "VALIDATION_ERROR",
      "Invalid user update.",
      zodFieldErrors(parsed.error.issues)
    );
  }
  try {
    const { id, restaurantId, ...rest } = parsed.data;
    const user = await adminRepository.updateUser({
      id,
      ...rest,
      restaurantId:
        restaurantId === "" || restaurantId === undefined
          ? restaurantId === ""
            ? null
            : undefined
          : restaurantId,
      actorId: actor.data.userId,
      actorEmail: actor.data.email,
    });
    if (!user) return adminFailure("NOT_FOUND", "User not found.");
    revalidateAdmin();
    return adminSuccess(user);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getAdminPlans(): Promise<
  AdminActionResult<SubscriptionPlanEntity[]>
> {
  const actor = await resolveAdminActor([
    "admin.subscriptions",
    "admin.dashboard",
  ]);
  if (!actor.success) return actor;
  try {
    const plans = await subscriptionRepository.findPlans({ activeOnly: false });
    return adminSuccess(plans);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function adminAssignPlan(
  input: unknown
): Promise<AdminActionResult<RestaurantSubscription>> {
  const actor = await resolveAdminActor(["admin.subscriptions"]);
  if (!actor.success) return actor;
  const parsed = adminAssignPlanSchema.safeParse(input);
  if (!parsed.success) {
    return adminFailure(
      "VALIDATION_ERROR",
      "Invalid assignment.",
      zodFieldErrors(parsed.error.issues)
    );
  }
  try {
    const subscription = await subscriptionRepository.assignPlan({
      restaurantId: parsed.data.restaurantId,
      planId: parsed.data.planId,
      billingCycle: parsed.data.billingCycle,
      startTrial: parsed.data.startTrial,
      userId: actor.data.userId,
    });
    await adminRepository.writeAudit({
      category: "subscription",
      action: "plan.assign",
      message: `Assigned plan to restaurant`,
      actorId: actor.data.userId,
      actorEmail: actor.data.email,
      restaurantId: parsed.data.restaurantId,
      targetType: "subscription",
      targetId: subscription.id,
    });
    revalidateAdmin();
    return adminSuccess(subscription);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function adminUpgradePlan(
  input: unknown
): Promise<AdminActionResult<RestaurantSubscription>> {
  const actor = await resolveAdminActor(["admin.subscriptions"]);
  if (!actor.success) return actor;
  const parsed = adminChangePlanSchema.safeParse({
    ...(typeof input === "object" && input ? input : {}),
    mode: "upgrade",
  });
  if (!parsed.success) {
    return adminFailure(
      "VALIDATION_ERROR",
      "Invalid upgrade.",
      zodFieldErrors(parsed.error.issues)
    );
  }
  try {
    const subscription = await subscriptionRepository.changePlan({
      restaurantId: parsed.data.restaurantId,
      planId: parsed.data.planId,
      billingCycle: parsed.data.billingCycle,
      mode: "upgrade",
      userId: actor.data.userId,
    });
    await adminRepository.writeAudit({
      category: "subscription",
      action: "plan.upgrade",
      message: "Upgraded restaurant plan",
      actorId: actor.data.userId,
      actorEmail: actor.data.email,
      restaurantId: parsed.data.restaurantId,
      targetType: "subscription",
      targetId: subscription.id,
    });
    revalidateAdmin();
    return adminSuccess(subscription);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function adminDowngradePlan(
  input: unknown
): Promise<AdminActionResult<RestaurantSubscription>> {
  const actor = await resolveAdminActor(["admin.subscriptions"]);
  if (!actor.success) return actor;
  const parsed = adminChangePlanSchema.safeParse({
    ...(typeof input === "object" && input ? input : {}),
    mode: "downgrade",
  });
  if (!parsed.success) {
    return adminFailure(
      "VALIDATION_ERROR",
      "Invalid downgrade.",
      zodFieldErrors(parsed.error.issues)
    );
  }
  try {
    const subscription = await subscriptionRepository.changePlan({
      restaurantId: parsed.data.restaurantId,
      planId: parsed.data.planId,
      billingCycle: parsed.data.billingCycle,
      mode: "downgrade",
      userId: actor.data.userId,
    });
    await adminRepository.writeAudit({
      category: "subscription",
      action: "plan.downgrade",
      message: "Downgraded restaurant plan",
      actorId: actor.data.userId,
      actorEmail: actor.data.email,
      restaurantId: parsed.data.restaurantId,
      targetType: "subscription",
      targetId: subscription.id,
    });
    revalidateAdmin();
    return adminSuccess(subscription);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function adminRenewSubscription(
  input: unknown
): Promise<AdminActionResult<RestaurantSubscription>> {
  const actor = await resolveAdminActor(["admin.subscriptions"]);
  if (!actor.success) return actor;
  const parsed = adminRenewSchema.safeParse(input);
  if (!parsed.success) {
    return adminFailure(
      "VALIDATION_ERROR",
      "Invalid renewal.",
      zodFieldErrors(parsed.error.issues)
    );
  }
  try {
    const subscription = await subscriptionRepository.renewSubscription({
      restaurantId: parsed.data.restaurantId,
      billingCycle: parsed.data.billingCycle,
      userId: actor.data.userId,
    });
    await adminRepository.writeAudit({
      category: "subscription",
      action: "plan.renew",
      message: "Renewed restaurant subscription",
      actorId: actor.data.userId,
      actorEmail: actor.data.email,
      restaurantId: parsed.data.restaurantId,
      targetType: "subscription",
      targetId: subscription.id,
    });
    revalidateAdmin();
    return adminSuccess(subscription);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function adminCancelSubscription(
  input: unknown
): Promise<AdminActionResult<RestaurantSubscription>> {
  const actor = await resolveAdminActor(["admin.subscriptions"]);
  if (!actor.success) return actor;
  const parsed = adminCancelSchema.safeParse(input);
  if (!parsed.success) {
    return adminFailure(
      "VALIDATION_ERROR",
      "Invalid cancellation.",
      zodFieldErrors(parsed.error.issues)
    );
  }
  try {
    const subscription = await subscriptionRepository.cancelSubscription({
      restaurantId: parsed.data.restaurantId,
      userId: actor.data.userId,
    });
    await adminRepository.writeAudit({
      category: "subscription",
      action: "plan.cancel",
      message: parsed.data.reason || "Cancelled restaurant subscription",
      actorId: actor.data.userId,
      actorEmail: actor.data.email,
      restaurantId: parsed.data.restaurantId,
      targetType: "subscription",
      targetId: subscription.id,
    });
    revalidateAdmin();
    return adminSuccess(subscription);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function adminExtendTrial(
  input: unknown
): Promise<AdminActionResult<RestaurantSubscription>> {
  const actor = await resolveAdminActor(["admin.subscriptions"]);
  if (!actor.success) return actor;
  const parsed = adminExtendTrialSchema.safeParse(input);
  if (!parsed.success) {
    return adminFailure(
      "VALIDATION_ERROR",
      "Invalid trial extension.",
      zodFieldErrors(parsed.error.issues)
    );
  }
  try {
    const subscription = await adminRepository.extendTrial({
      ...parsed.data,
      actorId: actor.data.userId,
      actorEmail: actor.data.email,
    });
    if (!subscription) {
      return adminFailure("NOT_FOUND", "No subscription found for this restaurant.");
    }
    revalidateAdmin();
    return adminSuccess(subscription);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getAdminRevenue(): Promise<
  AdminActionResult<AdminRevenueSummary>
> {
  const actor = await resolveAdminActor(["admin.reports", "admin.dashboard"]);
  if (!actor.success) return actor;
  try {
    return adminSuccess(await adminRepository.getRevenueSummary());
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getAdminReport(
  kind: unknown
): Promise<AdminActionResult<AdminGlobalReport>> {
  const actor = await resolveAdminActor(["admin.reports"]);
  if (!actor.success) return actor;
  const parsed = adminReportKindSchema.safeParse(kind);
  if (!parsed.success) {
    return adminFailure("VALIDATION_ERROR", "Invalid report kind.");
  }
  try {
    return adminSuccess(await adminRepository.getGlobalReport(parsed.data));
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getAdminSystemHealth(): Promise<
  AdminActionResult<AdminSystemHealth>
> {
  const actor = await resolveAdminActor(["admin.system"]);
  if (!actor.success) return actor;
  try {
    return adminSuccess(await adminRepository.getSystemHealth());
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getAdminAuditLogs(
  input: unknown = {}
): Promise<
  AdminActionResult<{ items: AdminAuditLog[]; meta: PaginationMeta }>
> {
  const actor = await resolveAdminActor(["admin.audit"]);
  if (!actor.success) return actor;
  const parsed = searchAuditSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return adminFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }
  try {
    return adminSuccess(await adminRepository.listAudit(parsed.data));
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getAdminFeatureFlags(): Promise<
  AdminActionResult<PlatformFeatureFlag[]>
> {
  const actor = await resolveAdminActor(["admin.settings", "admin.system"]);
  if (!actor.success) return actor;
  try {
    return adminSuccess(await adminRepository.listFeatureFlags());
  } catch (error) {
    return mapDbError(error);
  }
}

export async function toggleAdminFeatureFlag(
  input: unknown
): Promise<AdminActionResult<PlatformFeatureFlag>> {
  const actor = await resolveAdminActor(["admin.settings"]);
  if (!actor.success) return actor;
  const parsed = toggleFeatureFlagSchema.safeParse(input);
  if (!parsed.success) {
    return adminFailure(
      "VALIDATION_ERROR",
      "Invalid flag update.",
      zodFieldErrors(parsed.error.issues)
    );
  }
  try {
    const flag = await adminRepository.toggleFeatureFlag({
      ...parsed.data,
      actorId: actor.data.userId,
      actorEmail: actor.data.email,
    });
    if (!flag) return adminFailure("NOT_FOUND", "Feature flag not found.");
    revalidateAdmin();
    return adminSuccess(flag);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function adminGlobalSearch(
  input: unknown
): Promise<AdminActionResult<AdminSearchResult[]>> {
  const actor = await resolveAdminActor([
    "admin.dashboard",
    "admin.restaurants",
    "admin.users",
  ]);
  if (!actor.success) return actor;
  const parsed = adminSearchSchema.safeParse(input);
  if (!parsed.success) {
    return adminFailure(
      "VALIDATION_ERROR",
      "Enter a search query.",
      zodFieldErrors(parsed.error.issues)
    );
  }
  try {
    return adminSuccess(await adminRepository.globalSearch(parsed.data.q));
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getAdminSubscriptionsOverview(): Promise<
  AdminActionResult<{
    tenants: AdminTenantSummary[];
    plans: SubscriptionPlanEntity[];
  }>
> {
  const actor = await resolveAdminActor(["admin.subscriptions"]);
  if (!actor.success) return actor;
  try {
    const [tenants, plans] = await Promise.all([
      adminRepository.listTenants({ page: 1, pageSize: 50 }),
      subscriptionRepository.findPlans({ activeOnly: true }),
    ]);
    return adminSuccess({ tenants: tenants.items, plans });
  } catch (error) {
    return mapDbError(error);
  }
}
