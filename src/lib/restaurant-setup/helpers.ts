import { DEFAULT_TENANT_CONFIG } from "@/config/tenant";
import { setupSubscriptionPlans } from "@/config/restaurant-setup";
import { RESTAURANT_SETUP_STEP_IDS } from "@/types/restaurant-setup";
import type {
  RestaurantSetupDraft,
  RestaurantSetupReviewSection,
  RestaurantSetupStepId,
} from "@/types/restaurant-setup";

export const defaultRestaurantSetupDraft = (): RestaurantSetupDraft => ({
  restaurant: {
    restaurantName: "",
    slug: "",
    ownerName: "",
    ownerEmail: "",
    ownerMobile: "",
    restaurantPhone: "",
    gstNumber: "",
    logoPlaceholder: "",
    description: "",
  },
  location: {
    country: "IN",
    state: "",
    city: "",
    address: "",
    postalCode: "",
    timezone: DEFAULT_TENANT_CONFIG.timezone,
    currency: DEFAULT_TENANT_CONFIG.currency,
  },
  subscription: {
    planId: "trial",
  },
  branch: {
    mode: "single",
    branchName: "Main Branch",
    branchPhone: "",
    branchAddress: "",
  },
  tables: {
    totalTables: 20,
  },
});

/** Derive a URL-safe slug from a restaurant name (client helper). */
export function slugifyRestaurantName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function getSetupStepIndex(stepId: RestaurantSetupStepId): number {
  return RESTAURANT_SETUP_STEP_IDS.indexOf(stepId);
}

export function getNextSetupStepId(
  stepId: RestaurantSetupStepId
): RestaurantSetupStepId | null {
  const index = getSetupStepIndex(stepId);
  if (index < 0 || index >= RESTAURANT_SETUP_STEP_IDS.length - 1) return null;
  return RESTAURANT_SETUP_STEP_IDS[index + 1];
}

export function getPreviousSetupStepId(
  stepId: RestaurantSetupStepId
): RestaurantSetupStepId | null {
  const index = getSetupStepIndex(stepId);
  if (index <= 0) return null;
  return RESTAURANT_SETUP_STEP_IDS[index - 1];
}

export function buildTablePreviewLabels(totalTables: number): string[] {
  const count = Math.min(Math.max(Math.floor(totalTables) || 0, 0), 200);
  return Array.from({ length: count }, (_, index) => `Table ${index + 1}`);
}

export function getPlanDisplayName(planId: string): string {
  return (
    setupSubscriptionPlans.find((plan) => plan.id === planId)?.name ?? planId
  );
}

export function buildRestaurantSetupReviewSections(
  draft: RestaurantSetupDraft
): RestaurantSetupReviewSection[] {
  const display = (value?: string | number) => {
    if (typeof value === "number") return String(value);
    return value && value.trim().length > 0 ? value : "—";
  };

  return [
    {
      id: "restaurant",
      title: "Restaurant",
      fields: [
        { label: "Name", value: display(draft.restaurant.restaurantName) },
        { label: "Slug", value: display(draft.restaurant.slug) },
        { label: "Phone", value: display(draft.restaurant.restaurantPhone) },
        { label: "GST Number", value: display(draft.restaurant.gstNumber) },
        {
          label: "Description",
          value: display(draft.restaurant.description),
        },
      ],
    },
    {
      id: "owner",
      title: "Owner",
      fields: [
        { label: "Name", value: display(draft.restaurant.ownerName) },
        { label: "Email", value: display(draft.restaurant.ownerEmail) },
        { label: "Mobile", value: display(draft.restaurant.ownerMobile) },
      ],
    },
    {
      id: "location",
      title: "Location",
      fields: [
        { label: "Country", value: display(draft.location.country) },
        { label: "State", value: display(draft.location.state) },
        { label: "City", value: display(draft.location.city) },
        { label: "Address", value: display(draft.location.address) },
        { label: "Postal Code", value: display(draft.location.postalCode) },
        { label: "Timezone", value: display(draft.location.timezone) },
        { label: "Currency", value: display(draft.location.currency) },
      ],
    },
    {
      id: "branch",
      title: "Branch",
      fields: [
        {
          label: "Mode",
          value:
            draft.branch.mode === "multi" ? "Multi Branch" : "Single Branch",
        },
        { label: "Branch Name", value: display(draft.branch.branchName) },
        { label: "Branch Phone", value: display(draft.branch.branchPhone) },
        {
          label: "Branch Address",
          value: display(draft.branch.branchAddress),
        },
      ],
    },
    {
      id: "plan",
      title: "Plan",
      fields: [
        {
          label: "Subscription",
          value: getPlanDisplayName(draft.subscription.planId),
        },
      ],
    },
    {
      id: "tables",
      title: "Tables",
      fields: [
        {
          label: "Total Tables",
          value: display(draft.tables.totalTables),
        },
      ],
    },
  ];
}
