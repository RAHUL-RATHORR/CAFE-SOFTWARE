export {
  RESTAURANT_SETUP_ROUTE,
  RESTAURANT_SETUP_STORAGE_KEY,
  RESTAURANT_SETUP_TOTAL_STEPS,
  restaurantSetupSteps,
  getRestaurantSetupStepById,
  getRestaurantSetupStepByIndex,
  setupSubscriptionPlans,
  restaurantSetupNextSteps,
  countryOptions,
  currencyOptions,
  timezoneOptions,
} from "@/config/restaurant-setup";

export {
  restaurantInformationSetupSchema,
  locationSetupSchema,
  subscriptionSetupSchema,
  branchSetupSchema,
  tableSetupSchema,
  restaurantSetupDraftSchema,
  defaultRestaurantSetupDraft,
  slugifyRestaurantName,
  getSetupStepIndex,
  getNextSetupStepId,
  getPreviousSetupStepId,
  buildTablePreviewLabels,
  getPlanDisplayName,
  buildRestaurantSetupReviewSections,
} from "@/lib/restaurant-setup";

export { useRestaurantSetup } from "@/hooks/restaurant-setup";

export {
  RestaurantSetupWizard,
  WizardLayout,
  WizardFooter,
  RestaurantSetupStepper,
  SetupSummary,
  FinishScreen,
} from "@/components/restaurant-setup";
