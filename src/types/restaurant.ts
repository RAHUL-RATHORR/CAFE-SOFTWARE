/**
 * Restaurant domain types — schemas live in `@/lib/validators` (single source).
 * This module keeps the existing `@/types/restaurant` import path stable.
 */

export {
  subscriptionPlanSchema,
  subscriptionStatusSchema,
  restaurantSchema,
  restaurantUpdateSchema,
  type RestaurantInput,
  type RestaurantUpdateInput,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@/lib/validators";

import type { RestaurantInput } from "@/lib/validators";
import type { BaseDocumentFields } from "@/types/database";

export type Restaurant = RestaurantInput &
  Pick<BaseDocumentFields, "_id" | "createdAt" | "updatedAt"> &
  Partial<
    Pick<
      BaseDocumentFields,
      "createdBy" | "updatedBy" | "isDeleted" | "deletedAt" | "version"
    >
  >;
