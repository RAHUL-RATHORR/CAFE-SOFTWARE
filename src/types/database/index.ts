export type ObjectIdString = string;

export type DatabaseConnectionState =
  | "disconnected"
  | "connected"
  | "connecting"
  | "disconnecting"
  | "uninitialized";

export type DatabaseHealthStatus = "healthy" | "unhealthy" | "unknown";

export type DatabaseHealthResult = {
  status: DatabaseHealthStatus;
  ok: boolean;
  latencyMs: number | null;
  message: string;
  checkedAt: string;
};

export type PaginationParams = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type SoftDeleteFields = {
  isDeleted: boolean;
  deletedAt: Date | null;
};

export type AuditFields = {
  createdBy: ObjectIdString | null;
  updatedBy: ObjectIdString | null;
  createdAt: Date;
  updatedAt: Date;
};

export type VersionedFields = {
  version: number;
};

export type BaseDocumentFields = SoftDeleteFields &
  AuditFields &
  VersionedFields & {
    _id: ObjectIdString;
  };

export type TenantScoped = {
  restaurantId: ObjectIdString;
};

export type UserStatus = "active" | "inactive" | "invited" | "suspended";

export type DatabaseUserRole =
  | "super-admin"
  | "restaurant-owner"
  | "manager"
  | "cashier"
  | "chef"
  | "waiter"
  | "customer";

export type SubscriptionPlan =
  | "free"
  | "starter"
  | "pro"
  | "enterprise";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "inactive";

export type { User } from "./user";
