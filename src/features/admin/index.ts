export {
  getAdminDashboard,
  getAdminTenants,
  getAdminTenantById,
  updateTenantStatus,
  getAdminUsers,
  updateAdminUser,
  getAdminPlans,
  adminAssignPlan,
  adminUpgradePlan,
  adminDowngradePlan,
  adminRenewSubscription,
  adminCancelSubscription,
  adminExtendTrial,
  getAdminRevenue,
  getAdminReport,
  getAdminSystemHealth,
  getAdminAuditLogs,
  getAdminFeatureFlags,
  toggleAdminFeatureFlag,
  adminGlobalSearch,
  getAdminSubscriptionsOverview,
} from "@/actions/admin";

export {
  AdminShell,
  AdminDashboardView,
  AdminRestaurantsView,
  AdminUsersView,
  AdminSubscriptionsView,
  AdminPlansView,
  AdminRevenueView,
  AdminReportsView,
  AdminSystemView,
  AdminAuditView,
  AdminSettingsView,
} from "@/components/admin";

export { adminRepository } from "@/repositories/admin";
export {
  AuditLogModel,
  PlatformFeatureFlagModel,
  TenantAdminStateModel,
} from "@/models/admin";
export { ADMIN_NAV_ITEMS, DEFAULT_PLATFORM_FEATURE_FLAGS } from "@/config/admin";

export type {
  AdminDashboardSummary,
  AdminTenantSummary,
  AdminUserSummary,
  AdminAuditLog,
  PlatformFeatureFlag,
  AdminActionResult,
} from "@/types/admin";
