import type {
  RestaurantSetupStepDefinition,
  SetupSubscriptionPlanDefinition,
} from "@/types/restaurant-setup";
import { RESTAURANT_SETUP_STEP_IDS } from "@/types/restaurant-setup";

export const RESTAURANT_SETUP_ROUTE = "/admin/restaurants/onboard";
export const RESTAURANT_SETUP_STORAGE_KEY = "dineflow-restaurant-setup-draft";

export const restaurantSetupSteps: RestaurantSetupStepDefinition[] =
  RESTAURANT_SETUP_STEP_IDS.map((id, index) => {
    const meta: Record<
      (typeof RESTAURANT_SETUP_STEP_IDS)[number],
      { title: string; description: string; hasForm: boolean }
    > = {
      "restaurant-information": {
        title: "Restaurant",
        description:
          "Create the restaurant profile and owner account placeholders.",
        hasForm: true,
      },
      location: {
        title: "Location",
        description: "Set address, timezone, and currency defaults.",
        hasForm: true,
      },
      subscription: {
        title: "Subscription",
        description: "Choose a plan. Payment integration comes later.",
        hasForm: true,
      },
      "branch-setup": {
        title: "Branch",
        description: "Configure the primary branch (multi-branch ready).",
        hasForm: true,
      },
      "table-setup": {
        title: "Tables",
        description: "Create a simple table count preview (no QR yet).",
        hasForm: true,
      },
      review: {
        title: "Review",
        description: "Confirm restaurant, owner, branch, plan, and tables.",
        hasForm: false,
      },
      finish: {
        title: "Finish",
        description: "Restaurant setup is complete.",
        hasForm: false,
      },
    };

    return {
      id,
      index,
      title: meta[id].title,
      description: meta[id].description,
      hasForm: meta[id].hasForm,
    };
  });

export function getRestaurantSetupStepById(
  id: (typeof RESTAURANT_SETUP_STEP_IDS)[number]
) {
  return (
    restaurantSetupSteps.find((step) => step.id === id) ??
    restaurantSetupSteps[0]
  );
}

export function getRestaurantSetupStepByIndex(index: number) {
  return (
    restaurantSetupSteps.find((step) => step.index === index) ??
    restaurantSetupSteps[0]
  );
}

export const RESTAURANT_SETUP_TOTAL_STEPS = restaurantSetupSteps.length;

export const setupSubscriptionPlans: SetupSubscriptionPlanDefinition[] = [
  {
    id: "trial",
    name: "Trial",
    description: "Evaluate DineFlow with core restaurant operations.",
    priceLabel: "Free for 14 days",
    features: [
      "1 branch",
      "Up to 5 staff seats",
      "POS & kitchen display",
      "Basic reports",
      "Email support",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    description: "Solid starter plan for single-outlet cafés.",
    priceLabel: "From ₹999/mo",
    features: [
      "1 branch",
      "Up to 10 staff seats",
      "Tables & QR ordering prep",
      "Inventory basics",
      "Standard reports",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Growing restaurants that need multi-branch readiness.",
    priceLabel: "From ₹2,499/mo",
    recommended: true,
    features: [
      "Up to 3 branches",
      "Up to 25 staff seats",
      "CRM & loyalty prep",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Full platform access for multi-outlet brands.",
    priceLabel: "From ₹4,999/mo",
    features: [
      "Unlimited branches*",
      "Unlimited staff*",
      "Custom branding prep",
      "API access prep",
      "Dedicated success manager",
    ],
  },
];

export const restaurantSetupNextSteps = [
  { id: "credentials", label: "Create Login Credentials" },
  { id: "qr", label: "Generate QR Codes" },
  { id: "categories", label: "Add Categories" },
  { id: "menu", label: "Add Menu" },
] as const;
