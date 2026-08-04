import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import {
  AUDIT_EVENT_CATEGORIES,
  TENANT_PLATFORM_STATUSES,
  FEATURE_FLAG_SCOPES,
} from "@/types/admin";

const tenantAdminStateSchema = new Schema(
  withBaseFields({
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: TENANT_PLATFORM_STATUSES,
      default: "active",
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    suspendedAt: { type: Date, default: null },
    suspendedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  }),
  baseSchemaOptions
);

export type TenantAdminStateDocument = InferSchemaType<
  typeof tenantAdminStateSchema
> & { _id: Schema.Types.ObjectId };

export const TenantAdminStateModel: Model<TenantAdminStateDocument> =
  models.TenantAdminState ||
  model<TenantAdminStateDocument>("TenantAdminState", tenantAdminStateSchema);

const auditLogSchema = new Schema(
  withBaseFields({
    category: {
      type: String,
      enum: AUDIT_EVENT_CATEGORIES,
      required: true,
      index: true,
    },
    action: { type: String, required: true, trim: true, maxlength: 80 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    actorEmail: { type: String, trim: true, default: "" },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
      index: true,
    },
    restaurantName: { type: String, trim: true, default: "" },
    targetType: { type: String, trim: true, default: "system", maxlength: 80 },
    targetId: { type: String, trim: true, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  }),
  baseSchemaOptions
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & {
  _id: Schema.Types.ObjectId;
};

export const AuditLogModel: Model<AuditLogDocument> =
  models.AuditLog || model<AuditLogDocument>("AuditLog", auditLogSchema);

const platformFeatureFlagSchema = new Schema(
  withBaseFields({
    key: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 120,
      index: true,
    },
    label: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    enabled: { type: Boolean, default: false, index: true },
    scope: {
      type: String,
      enum: FEATURE_FLAG_SCOPES,
      default: "global",
      index: true,
    },
    planSlug: { type: String, trim: true, default: null },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
      index: true,
    },
    moduleKey: { type: String, trim: true, default: "general", maxlength: 80 },
    isBeta: { type: Boolean, default: false },
    isEarlyAccess: { type: Boolean, default: false },
  }),
  baseSchemaOptions
);

export type PlatformFeatureFlagDocument = InferSchemaType<
  typeof platformFeatureFlagSchema
> & { _id: Schema.Types.ObjectId };

export const PlatformFeatureFlagModel: Model<PlatformFeatureFlagDocument> =
  models.PlatformFeatureFlag ||
  model<PlatformFeatureFlagDocument>(
    "PlatformFeatureFlag",
    platformFeatureFlagSchema
  );
