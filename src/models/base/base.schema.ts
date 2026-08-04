import { Schema, type SchemaDefinition } from "mongoose";

/**
 * Reusable multi-tenant audit / soft-delete fields.
 * Pair with `timestamps: true` for createdAt / updatedAt.
 */
export const baseSchemaDefinition = {
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  version: {
    type: Number,
    default: 1,
    min: 1,
  },
} satisfies SchemaDefinition;

export const baseSchemaOptions = {
  timestamps: true,
  versionKey: false,
} as const;

export function withBaseFields<T extends SchemaDefinition>(
  definition: T
): T & typeof baseSchemaDefinition {
  return {
    ...definition,
    ...baseSchemaDefinition,
  };
}
