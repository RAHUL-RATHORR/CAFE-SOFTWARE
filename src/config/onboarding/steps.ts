import type { OnboardingStepDefinition } from "@/types/onboarding";
import { ONBOARDING_STEP_IDS } from "@/types/onboarding";

export const ONBOARDING_ROUTE = "/onboarding";
export const ONBOARDING_STORAGE_KEY = "dineflow-onboarding-draft";

export const onboardingSteps: OnboardingStepDefinition[] = [
  {
    id: "welcome",
    index: 0,
    title: "Welcome",
    description: "Get your restaurant workspace ready in a few guided steps.",
    hasForm: false,
  },
  {
    id: "restaurant-information",
    index: 1,
    title: "Restaurant Information",
    description: "Tell us about your restaurant identity and contact details.",
    hasForm: true,
  },
  {
    id: "business-details",
    index: 2,
    title: "Business Details",
    description: "Capture business type and registration placeholders.",
    hasForm: true,
  },
  {
    id: "address",
    index: 3,
    title: "Address",
    description: "Where is your restaurant located?",
    hasForm: true,
  },
  {
    id: "currency-timezone",
    index: 4,
    title: "Currency & Timezone",
    description: "Set regional defaults for pricing and schedules.",
    hasForm: true,
  },
  {
    id: "branding",
    index: 5,
    title: "Branding",
    description: "Choose brand colors and theme preferences.",
    hasForm: true,
  },
  {
    id: "review",
    index: 6,
    title: "Review",
    description: "Confirm your details before finishing onboarding.",
    hasForm: false,
  },
  {
    id: "completion",
    index: 7,
    title: "Completion",
    description: "Your restaurant draft is ready for the next module.",
    hasForm: false,
  },
];

export function getOnboardingStepById(id: (typeof ONBOARDING_STEP_IDS)[number]) {
  return onboardingSteps.find((step) => step.id === id) ?? onboardingSteps[0];
}

export function getOnboardingStepByIndex(index: number) {
  return (
    onboardingSteps.find((step) => step.index === index) ?? onboardingSteps[0]
  );
}

export const ONBOARDING_TOTAL_STEPS = onboardingSteps.length;
