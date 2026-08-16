/**
 * Super Admin restaurant onboarding & setup wizard types.
 * UI-flow only — no API / auth / payment side effects.
 */

export const RESTAURANT_SETUP_STEP_IDS = [
  "restaurant-information",
  "location",
  "subscription",
  "branch-setup",
  "table-setup",
  "review",
  "finish",
] as const;

export type RestaurantSetupStepId =
  (typeof RESTAURANT_SETUP_STEP_IDS)[number];

export type RestaurantSetupStepStatus =
  | "upcoming"
  | "current"
  | "completed";

export type RestaurantSetupFlowStatus =
  | "idle"
  | "in-progress"
  | "review"
  | "completed";

export type RestaurantSetupStepDefinition = {
  id: RestaurantSetupStepId;
  index: number;
  title: string;
  description: string;
  hasForm: boolean;
};

export const SETUP_SUBSCRIPTION_PLAN_IDS = [
  "trial",
  "basic",
  "pro",
  "premium",
] as const;

export type SetupSubscriptionPlanId =
  (typeof SETUP_SUBSCRIPTION_PLAN_IDS)[number];

export type SetupSubscriptionPlanDefinition = {
  id: SetupSubscriptionPlanId;
  name: string;
  description: string;
  priceLabel: string;
  features: string[];
  recommended?: boolean;
};

export const BRANCH_SETUP_MODES = ["single", "multi"] as const;
export type BranchSetupMode = (typeof BRANCH_SETUP_MODES)[number];

export type RestaurantInformationSetupDraft = {
  restaurantName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  ownerMobile: string;
  restaurantPhone: string;
  gstNumber?: string;
  logoPlaceholder?: string;
  description?: string;
};

export type LocationSetupDraft = {
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
  timezone: string;
  currency: string;
};

export type SubscriptionSetupDraft = {
  planId: SetupSubscriptionPlanId;
};

export type BranchSetupDraft = {
  mode: BranchSetupMode;
  branchName: string;
  branchPhone: string;
  branchAddress: string;
};

export type TableSetupDraft = {
  totalTables: number;
};

export type RestaurantSetupDraft = {
  restaurant: RestaurantInformationSetupDraft;
  location: LocationSetupDraft;
  subscription: SubscriptionSetupDraft;
  branch: BranchSetupDraft;
  tables: TableSetupDraft;
};

export type RestaurantSetupReviewSection = {
  id: string;
  title: string;
  fields: Array<{ label: string; value: string }>;
};

export type RestaurantSetupNextStep = {
  id: string;
  label: string;
};
