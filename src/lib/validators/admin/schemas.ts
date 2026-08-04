import { z } from "zod";
import {
  TENANT_PLATFORM_STATUSES,
  AUDIT_EVENT_CATEGORIES,
  FEATURE_FLAG_SCOPES,
} from "@/types/admin";
import { BILLING_CYCLES } from "@/types/subscription";

const objectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid id");

const userStatusEnum = z.enum([
  "active",
  "inactive",
  "invited",
  "suspended",
]);

const userRoleEnum = z.enum([
  "super-admin",
  "restaurant-owner",
  "manager",
  "cashier",
  "chef",
  "waiter",
  "customer",
]);

export const tenantStatusSchema = z.enum(TENANT_PLATFORM_STATUSES);

export const updateTenantStatusSchema = z.object({
  restaurantId: objectId,
  status: tenantStatusSchema,
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const updateAdminUserSchema = z.object({
  id: objectId,
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  role: userRoleEnum.optional(),
  status: userStatusEnum.optional(),
  restaurantId: z.preprocess(
    (value) => (value === "" ? null : value),
    z
      .string()
      .trim()
      .regex(/^[a-f\d]{24}$/i)
      .nullable()
      .optional()
  ),
});

export const adminAssignPlanSchema = z.object({
  restaurantId: objectId,
  planId: objectId,
  billingCycle: z.enum(BILLING_CYCLES).default("monthly"),
  startTrial: z.boolean().default(false),
});

export const adminChangePlanSchema = z.object({
  restaurantId: objectId,
  planId: objectId,
  billingCycle: z.enum(BILLING_CYCLES).optional(),
  mode: z.enum(["upgrade", "downgrade"]),
});

export const adminRenewSchema = z.object({
  restaurantId: objectId,
  billingCycle: z.enum(BILLING_CYCLES).optional(),
});

export const adminCancelSchema = z.object({
  restaurantId: objectId,
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

export const adminExtendTrialSchema = z.object({
  restaurantId: objectId,
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export const toggleFeatureFlagSchema = z.object({
  id: objectId,
  enabled: z.boolean(),
});

export const adminSearchSchema = z.object({
  q: z.string().trim().min(1).max(120),
});

export const adminReportKindSchema = z.enum([
  "revenue",
  "tenant-growth",
  "subscription-growth",
  "user-growth",
  "restaurant-growth",
  "platform-usage",
  "storage-usage",
  "api-usage",
]);

export const searchTenantsSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(["all", ...TENANT_PLATFORM_STATUSES]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const searchAdminUsersSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: z
    .enum(["all", "active", "inactive", "invited", "suspended"])
    .default("all"),
  role: z.string().trim().optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const searchAuditSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  category: z.enum(["all", ...AUDIT_EVENT_CATEGORIES]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createFeatureFlagSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(
      /^[a-z0-9._-]+$/,
      "Use lowercase letters, numbers, dots, underscores"
    ),
  label: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  enabled: z.boolean().default(false),
  scope: z.enum(FEATURE_FLAG_SCOPES).default("global"),
  planSlug: z.string().trim().max(80).nullable().optional(),
  restaurantId: objectId.nullable().optional(),
  moduleKey: z.string().trim().max(80).default("general"),
  isBeta: z.boolean().default(false),
  isEarlyAccess: z.boolean().default(false),
});
