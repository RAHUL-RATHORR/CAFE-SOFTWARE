export {
  ONBOARDING_ROUTE,
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_TOTAL_STEPS,
  onboardingSteps,
  getOnboardingStepById,
  getOnboardingStepByIndex,
  businessTypeOptions,
  cuisineTypeOptions,
  currencyOptions,
  timezoneOptions,
  themePreferenceOptions,
  countryOptions,
} from "@/config/onboarding";

export {
  restaurantInformationSchema,
  businessDetailsSchema,
  addressSchema,
  currencyTimezoneSchema,
  brandingSchema,
  onboardingDraftSchema,
  defaultOnboardingDraft,
  draftToTenantPlaceholder,
} from "@/lib/onboarding";

export { useOnboarding } from "@/hooks/onboarding";

export {
  OnboardingWizard,
  OnboardingShell,
  OnboardingStepper,
  ProgressIndicator,
  OnboardingCard,
  StepHeader,
  StepFooter,
  ReviewCard,
  CompletionScreen,
} from "@/components/onboarding";
