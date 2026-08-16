import { z } from "zod";
import {
  SAAS_SUBSCRIPTION_STATUSES,
  BILLING_CYCLES,
  SAAS_FEATURE_KEYS,
  INVOICE_FOUNDATION_STATUSES,
  PLAN_IDS,
} from "@/types/subscription";

const objectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid id");

export const saasFeatureKeySchema = z.enum(SAAS_FEATURE_KEYS);
export const saasStatusSchema = z.enum(SAAS_SUBSCRIPTION_STATUSES);
export const billingCycleSchema = z.enum(BILLING_CYCLES);
export const invoiceStatusSchema = z.enum(INVOICE_FOUNDATION_STATUSES);
export const planIdSchema = z.enum(PLAN_IDS);

const planFieldsSchema = z.object({
  planKey: planIdSchema.optional().nullable(),
  name: z.string().trim().min(1, "Name is required").max(120),
  displayName: z.string().trim().max(120).optional().or(z.literal("")),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  monthlyPrice: z.coerce.number().min(0).default(0),
  yearlyPrice: z.coerce.number().min(0).default(0),
  currency: z.string().trim().length(3).uppercase().default("INR"),
  trialDays: z.coerce.number().int().min(0).max(365).default(14),
  maxBranches: z.coerce.number().int().min(0).default(1),
  maxStaff: z.coerce.number().int().min(0).default(3),
  maxUsers: z.coerce.number().int().min(0).default(3),
  maxOrdersPerMonth: z.coerce.number().int().min(0).default(200),
  maxMenuItems: z.coerce.number().int().min(0).default(50),
  maxTables: z.coerce.number().int().min(0).default(10),
  maxCustomers: z.coerce.number().int().min(0).default(100),
  storageLimit: z.coerce.number().int().min(0).default(500),
  features: z.array(saasFeatureKeySchema).default([]),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(100),
});

export const createPlanSchema = planFieldsSchema;
export const updatePlanSchema = planFieldsSchema.partial().extend({
  id: objectId,
});
export const deletePlanSchema = z.object({ id: objectId });

export const assignPlanSchema = z.object({
  planId: objectId,
  billingCycle: billingCycleSchema.default("monthly"),
  startTrial: z.boolean().default(true),
});

export const changePlanSchema = z.object({
  planId: objectId,
  billingCycle: billingCycleSchema.optional(),
  acknowledgeDowngradeLimits: z.boolean().optional().default(false),
  scheduleAtPeriodEnd: z.boolean().optional().default(true),
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().trim().max(500).optional().or(z.literal("")),
  cancelAtPeriodEnd: z.boolean().optional().default(true),
});

export const reverseCancellationSchema = z.object({
  confirm: z.boolean().optional().default(true),
});

export const renewSubscriptionSchema = z.object({
  billingCycle: billingCycleSchema.optional(),
});

export const searchPlansSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  activeOnly: z.coerce.boolean().optional().default(true),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type DeletePlanInput = z.infer<typeof deletePlanSchema>;
export type AssignPlanInput = z.infer<typeof assignPlanSchema>;
export type ChangePlanInput = z.infer<typeof changePlanSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type ReverseCancellationInput = z.infer<typeof reverseCancellationSchema>;
export type RenewSubscriptionInput = z.infer<typeof renewSubscriptionSchema>;
export type SearchPlansInput = z.infer<typeof searchPlansSchema>;
