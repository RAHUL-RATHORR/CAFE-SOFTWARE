export type {
  Restaurant,
  RestaurantInput,
  RestaurantUpdateInput,
  SubscriptionPlan,
  SubscriptionStatus,
} from "./restaurant";

export {
  restaurantSchema,
  restaurantUpdateSchema,
  subscriptionPlanSchema,
  subscriptionStatusSchema,
} from "./restaurant";

export type {
  ThemeMode,
  ResolvedTheme,
  ApiResult,
  Paginated,
} from "./common";

export type {
  OrderStatus,
  StatTrend,
  DashboardStat,
  RecentOrder,
  QuickAction,
  SalesPeriod,
  TodaySummaryItem,
  PopularMenuItem,
  KitchenActivityItem,
  BreadcrumbItemData,
} from "./dashboard";

export type {
  TableStatus,
  SortDirection,
  SampleTableRow,
  TableColumnDef,
  FilterOption,
} from "./table";

export type {
  FormLayout,
  FieldState,
  SelectOption,
  FormFieldBaseProps,
  FormWrapperProps,
} from "./form";

export type {
  ModalSize,
  DrawerSide,
  ConfirmVariant,
  AlertTone,
  ToastTone,
  NotificationCategory,
  ToastItem,
  AppNotification,
  ConfirmDialogConfig,
  AlertDialogConfig,
  ModalRenderProps,
} from "./feedback";

export type {
  SearchCategoryId,
  CommandActionType,
  SearchCommand,
  SearchResultGroup,
} from "./search";

export type {
  TimeFormat,
  Density,
  UserPreferences,
  PreferenceSectionId,
} from "./preferences";

export type {
  DesignTone,
  DesignSize,
  BadgeVariant,
  StatusKind,
  StatusDisplay,
  EmptyStateKind,
  ErrorStateKind,
} from "./design";

export type {
  SidebarMode,
  WorkspaceViewState,
  WorkspaceTab,
  WorkspaceTabContextAction,
  WorkspaceToolbarSlot,
} from "./workspace";

export type {
  AppRole,
  PermissionPlaceholder,
  FeatureFlagPlaceholder,
  NavigationGroupId,
  PageMetadataConfig,
  RouteConfig,
  NavigationGroup,
  MenuItem,
  BreadcrumbItem,
  NavItem,
  NavigationVisibilityContext,
} from "./navigation";

export type {
  AuthUser,
  AuthSessionStatus,
  AuthErrorCode,
  AuthRouteKind,
  RouteProtectionConfig,
  LoginFormValues,
  ForgotPasswordFormValues,
  ResetPasswordFormValues,
  ChangePasswordFormValues,
} from "./auth";

export type {
  ObjectIdString,
  DatabaseConnectionState,
  DatabaseHealthResult,
  PaginationParams,
  PaginationMeta,
  PaginatedResult,
  BaseDocumentFields,
  TenantScoped,
  UserStatus,
  DatabaseUserRole,
  User,
} from "./database";

export type {
  RbacRole,
  RbacResource,
  RbacAction,
  RbacScope,
  PermissionKey,
  PermissionDefinition,
  PermissionGroupId,
  PermissionGroup,
  RolePermissionMap,
  RbacContext,
  VisibilityTarget,
  RoutePermissionBinding,
} from "./rbac";

export type {
  TenantId,
  Tenant,
  TenantConfig,
  TenantBranding,
  TenantAddress,
  TenantBusinessDetails,
  TenantMetadata,
  TenantSettingsPlaceholder,
  TenantIsolationContext,
  TenantSwitcherOption,
  TenantContextValue,
  TenantThemePreference,
} from "./tenant";

export type {
  OnboardingStepId,
  OnboardingStepStatus,
  OnboardingFlowStatus,
  OnboardingStepDefinition,
  OnboardingDraft,
  OnboardingReviewSection,
  OnboardingTenantPreview,
  RestaurantInformationDraft,
  BusinessDetailsDraft,
  AddressDraft,
  CurrencyTimezoneDraft,
  BrandingDraft,
} from "./onboarding";

export { ONBOARDING_STEP_IDS } from "./onboarding";

export type {
  RestaurantSetupStepId,
  RestaurantSetupStepStatus,
  RestaurantSetupFlowStatus,
  RestaurantSetupStepDefinition,
  RestaurantSetupDraft,
  RestaurantSetupReviewSection,
  RestaurantInformationSetupDraft,
  LocationSetupDraft,
  SubscriptionSetupDraft,
  BranchSetupDraft,
  TableSetupDraft,
  SetupSubscriptionPlanId,
  SetupSubscriptionPlanDefinition,
  BranchSetupMode,
} from "./restaurant-setup";

export {
  RESTAURANT_SETUP_STEP_IDS,
  SETUP_SUBSCRIPTION_PLAN_IDS,
  BRANCH_SETUP_MODES,
} from "./restaurant-setup";

export type {
  Branch,
  BranchStatus,
  BranchSettings,
  BranchSummary,
  BranchAddress,
  BranchContact,
  BranchOpeningHours,
  BranchCoordinates,
  BranchSwitcherOption,
  BranchRolePlaceholder,
  BranchAccessPlaceholder,
  BranchListResult,
  BranchSortField,
  BranchActionError,
  BranchActionErrorCode,
  BranchActionResult,
} from "./branch";

export { BRANCH_STATUSES } from "./branch";

export type {
  Category,
  CategoryListResult,
  CategorySortField,
  CategoryActionError,
  CategoryActionErrorCode,
  CategoryActionResult,
} from "./category";

export type {
  MenuItem as MenuItemRecord,
  MenuItemListResult,
  MenuItemSortField,
  MenuItemActionError,
  MenuItemActionErrorCode,
  MenuItemActionResult,
  CategoryOption as MenuCategoryOption,
} from "./menu-item";

export type {
  RestaurantTable,
  RestaurantTableStatus,
  RestaurantTableShape,
  RestaurantTableListResult,
  RestaurantTableSortField,
  RestaurantTableQrSummary,
  BulkTablePreviewItem,
  BulkTablePreviewResult,
  BulkTableCreateResult,
  RestaurantTableActionError,
  RestaurantTableActionErrorCode,
  RestaurantTableActionResult,
  FloorOption,
} from "./restaurant-table";

export {
  RESTAURANT_TABLE_STATUSES,
  RESTAURANT_TABLE_SHAPES,
} from "./restaurant-table";

export type {
  RestaurantOrder,
  RestaurantOrderStatus,
  OrderType,
  OrderLineItem,
  OrderStatusHistoryEntry,
  PaymentStatus,
  PaymentMethod,
  OrderPriority,
  RestaurantOrderListResult,
  RestaurantOrderSortField,
  OrderSelectOption,
  OrderFormOptions,
  OrderActionError,
  OrderActionErrorCode,
  OrderActionResult,
} from "./order";

export {
  ORDER_TYPES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  ORDER_PRIORITIES,
} from "./order";

export type {
  KitchenTicket,
  KitchenBoard,
  KitchenBoardColumn,
  KitchenSummary,
  KitchenDashboardData,
  KitchenFilterOptions,
  KitchenActionError,
  KitchenActionErrorCode,
  KitchenActionResult,
} from "./kitchen";

export { KITCHEN_BOARD_COLUMNS } from "./kitchen";

export type {
  Bill,
  Payment,
  Invoice,
  Receipt,
  BillListResult,
  BillingSummary,
  PosCatalog,
  PosCartItem,
  BillPaymentStatus,
  BillPaymentMethod,
  BillingActionResult,
} from "./billing";

export {
  BILL_PAYMENT_STATUSES,
  BILL_PAYMENT_METHODS,
  DISCOUNT_TYPES,
  TAX_TYPES,
} from "./billing";

export type {
  Customer,
  CustomerStatus,
  CustomerGender,
  CustomerPreferredOrderType,
  CustomerAddress,
  CustomerNote,
  CustomerLoyalty,
  CustomerProfile,
  CustomerListResult,
  CustomerSortField,
  CustomerSelectOption,
  CustomerOrderHistoryItem,
  CustomerVisitHistoryItem,
  CustomerBillingSummary,
  CustomerActionError,
  CustomerActionErrorCode,
  CustomerActionResult,
} from "./customer";

export {
  CUSTOMER_STATUSES,
  CUSTOMER_GENDERS,
  CUSTOMER_ORDER_TYPES,
} from "./customer";

export type {
  Vendor,
  VendorStatus,
  VendorListResult,
  VendorSortField,
  VendorSelectOption,
  VendorActionError,
  VendorActionErrorCode,
  VendorActionResult,
} from "./vendor";

export { VENDOR_STATUSES } from "./vendor";

export type {
  PurchaseOrder,
  PurchaseStatus,
  PurchaseItem,
  PurchaseOrderListResult,
  PurchaseSortField,
  PurchaseFormOptions,
  GoodsReceiptFoundation,
  PurchaseActionError,
  PurchaseActionErrorCode,
  PurchaseActionResult,
} from "./purchase";

export { PURCHASE_STATUSES } from "./purchase";

export type {
  Employee,
  EmployeeStatus,
  EmploymentType,
  StaffDepartment,
  StaffDesignation,
  EmployeeEmergencyContact,
  EmployeeListResult,
  EmployeeSortField,
  EmployeeSelectOption,
  StaffDashboardSummary,
  StaffActionError,
  StaffActionErrorCode,
  StaffActionResult,
} from "./staff";

export {
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  STAFF_DEPARTMENTS,
  STAFF_DESIGNATIONS,
} from "./staff";

export type {
  Shift,
  ShiftStatus,
  WeekDay,
  ShiftListResult,
  ShiftSortField,
  ShiftActionError,
  ShiftActionErrorCode,
  ShiftActionResult,
} from "./shift";

export { SHIFT_STATUSES, WEEK_DAYS } from "./shift";

export type {
  AttendanceRecord,
  AttendanceStatus,
  LeaveType,
  LeaveRequestStatus,
  LeaveRequest,
  LeaveBalancePlaceholder,
  HolidayPlaceholder,
} from "./attendance";

export {
  ATTENDANCE_STATUSES,
  LEAVE_TYPES,
  LEAVE_REQUEST_STATUSES,
} from "./attendance";

export type {
  Ingredient,
  InventoryUnit,
  IngredientStatus,
  IngredientSelectOption,
  InventoryStockUpdatePlaceholder,
} from "./inventory";

export { INVENTORY_UNITS, INGREDIENT_STATUSES } from "./inventory";

export type {
  ReportKind,
  ReportDatePreset,
  ReportKpi,
  ReportChartPoint,
  ExecutiveDashboardData,
  ModuleReportData,
  ReportExportPlaceholder,
  SavedReportPlaceholder,
  ReportActionResult,
  ReportActionError,
  ReportActionErrorCode,
} from "./report";

export { REPORT_KINDS, REPORT_DATE_PRESETS } from "./report";

export type {
  AdminDashboardSummary,
  AdminTenantSummary,
  AdminTenantDetail,
  AdminUserSummary,
  AdminAuditLog,
  PlatformFeatureFlag,
  AdminRevenueSummary,
  AdminSystemHealth,
  AdminGlobalReport,
  AdminSearchResult,
  AdminActionResult,
  TenantPlatformStatus,
  AuditEventCategory,
} from "./admin";

export {
  TENANT_PLATFORM_STATUSES,
  AUDIT_EVENT_CATEGORIES,
  FEATURE_FLAG_SCOPES,
} from "./admin";

export type {
  SubscriptionPlanEntity,
  RestaurantSubscription,
  UsageMetrics,
  InvoiceFoundation,
  FeatureAccess,
  SaasSubscriptionStatus,
  SaasFeatureKey,
  BillingCycle,
  SubscriptionDashboardSummary,
  LicenseValidationResult,
  LimitCheckResult,
  TenantLimitSnapshot,
  SubscriptionActionResult,
  SubscriptionActionError,
  SubscriptionActionErrorCode,
} from "./subscription";

export {
  SAAS_SUBSCRIPTION_STATUSES,
  BILLING_CYCLES,
  SAAS_FEATURE_KEYS,
  USAGE_METRIC_KEYS,
  INVOICE_FOUNDATION_STATUSES,
} from "./subscription";

export type {
  ApplicationHealthResult,
  MonitoringSnapshot,
  RateLimitResult,
  TraceContext,
  AuditChangePayload,
  LogContext,
  StructuredLogEntry,
  AppErrorCode,
  AppErrorKind,
  HealthStatus,
  ComponentHealth,
  OperationMetric,
  RateLimitBucket,
  SecurityHeaderMap,
} from "./production";
