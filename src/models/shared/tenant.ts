import { Schema } from "mongoose";

/** Tenant scope field for restaurant-owned documents. */
export const tenantScopeDefinition = {
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    index: true,
    default: null,
  },
} as const;
