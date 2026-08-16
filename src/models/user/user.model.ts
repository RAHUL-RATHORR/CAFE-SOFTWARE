import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import {
  DATABASE_USER_ROLES,
  USER_STATUSES,
  tenantScopeDefinition,
} from "@/models/shared";

const userSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    /** Password field — store hash */
    password: {
      type: String,
      default: "",
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },
    avatar: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: [...DATABASE_USER_ROLES],
      default: "manager",
      index: true,
    },
    status: {
      type: String,
      enum: [...USER_STATUSES],
      default: "invited",
      index: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  }),
  {
    ...baseSchemaOptions,
    collection: "users",
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ restaurantId: 1, email: 1 });
userSchema.index({ restaurantId: 1, role: 1 });
userSchema.index({ isDeleted: 1, status: 1 });

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const UserModel: Model<UserDocument> =
  models.User ?? model<UserDocument>("User", userSchema);
