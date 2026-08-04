/**
 * Restaurant onboarding types — UI flow only.
 */

import type {
  TenantAddress,
  TenantBranding,
  TenantBusinessDetails,
  TenantContact,
  TenantMetadata,
  TenantThemePreference,
} from "@/types/tenant";

export const ONBOARDING_STEP_IDS = [
  "welcome",
  "restaurant-information",
  "business-details",
  "address",
  "currency-timezone",
  "branding",
  "review",
  "completion",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number];

export type OnboardingStepStatus = "upcoming" | "current" | "completed";

export type OnboardingFlowStatus =
  | "idle"
  | "in-progress"
  | "review"
  | "completed";

export type OnboardingStepDefinition = {
  id: OnboardingStepId;
  index: number;
  title: string;
  description: string;
  /** Whether the step collects validated form data */
  hasForm: boolean;
};

export type RestaurantInformationDraft = {
  name: string;
  slug: string;
  businessEmail: string;
  phone: string;
  /** Logo upload is placeholder-only */
  logoPlaceholder?: string;
  description?: string;
};

export type BusinessDetailsDraft = TenantBusinessDetails;

export type AddressDraft = TenantAddress;

export type CurrencyTimezoneDraft = {
  currency: string;
  timezone: string;
};

export type BrandingDraft = {
  logoUrl?: string;
  receiptLogoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  themePreference: TenantThemePreference;
};

export type OnboardingDraft = {
  restaurant: RestaurantInformationDraft;
  business: BusinessDetailsDraft;
  address: AddressDraft;
  regional: CurrencyTimezoneDraft;
  branding: BrandingDraft;
};

export type OnboardingReviewSection = {
  id: string;
  title: string;
  fields: Array<{ label: string; value: string }>;
};

/** Shape used when mapping draft → tenant placeholder (client only) */
export type OnboardingTenantPreview = {
  name: string;
  slug: string;
  contact: TenantContact;
  address: TenantAddress;
  business: TenantBusinessDetails;
  metadata: TenantMetadata;
  branding: TenantBranding;
  currency: string;
  timezone: string;
};
