export {
  RestaurantModel,
  type RestaurantDocument,
} from "./restaurant";

export { UserModel, type UserDocument } from "./user";

export { BranchModel, type BranchDocument } from "./branch";

export { CategoryModel, type CategoryDocument } from "./category";

export { MenuItemModel, type MenuItemDocument } from "./menu-item";

export {
  RestaurantTableModel,
  type RestaurantTableDocument,
} from "./restaurant-table";

export { OrderModel, type OrderDocument } from "./order";

export { BillModel, PaymentModel, type BillDocument, type PaymentDocument } from "./billing";

export { CustomerModel, type CustomerDocument } from "./customer";

export { VendorModel, type VendorDocument } from "./vendor";

export { EmployeeModel, type EmployeeDocument } from "./staff";

export { ShiftModel, type ShiftDocument } from "./shift";

export {
  AttendanceModel,
  LeaveRequestModel,
  type AttendanceDocument,
  type LeaveRequestDocument,
} from "./attendance";

export {
  SubscriptionPlanModel,
  RestaurantSubscriptionModel,
  UsageMetricsModel,
  InvoiceFoundationModel,
  FeatureAccessModel,
  type SubscriptionPlanDocument,
  type RestaurantSubscriptionDocument,
  type UsageMetricsDocument,
  type InvoiceFoundationDocument,
  type FeatureAccessDocument,
} from "./subscription";

export {
  AuditLogModel,
  PlatformFeatureFlagModel,
  TenantAdminStateModel,
  type AuditLogDocument,
  type PlatformFeatureFlagDocument,
  type TenantAdminStateDocument,
} from "./admin";

export {
  PurchaseOrderModel,
  type PurchaseOrderDocument,
} from "./purchase";

export {
  IngredientModel,
  type IngredientDocument,
} from "./inventory";

export {
  SystemMetaModel,
  type SystemMetaDocument,
} from "./system";

export {
  baseSchemaDefinition,
  baseSchemaOptions,
  withBaseFields,
} from "./base";

export {
  DATABASE_USER_ROLES,
  DATABASE_USER_ROLE_LABELS,
  USER_STATUSES,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
  tenantScopeDefinition,
} from "./shared";
