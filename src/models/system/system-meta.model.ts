import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";

/**
 * System-level meta document placeholder for multi-tenant platform settings.
 * No business CRUD — schema foundation only.
 */
const systemMetaSchema = new Schema(
  withBaseFields({
    key: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 120,
    },
    value: {
      type: Schema.Types.Mixed,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  }),
  {
    ...baseSchemaOptions,
    collection: "system_meta",
  }
);

systemMetaSchema.index({ isActive: 1, isDeleted: 1 });

export type SystemMetaDocument = InferSchemaType<typeof systemMetaSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const SystemMetaModel: Model<SystemMetaDocument> =
  models.SystemMeta ??
  model<SystemMetaDocument>("SystemMeta", systemMetaSchema);
