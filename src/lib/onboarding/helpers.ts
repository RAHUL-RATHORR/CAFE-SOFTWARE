import { DEFAULT_TENANT_BRANDING } from "@/config/tenant";
import type {
  OnboardingDraft,
  OnboardingReviewSection,
  OnboardingStepId,
  OnboardingTenantPreview,
} from "@/types/onboarding";
import { ONBOARDING_STEP_IDS } from "@/types/onboarding";
import type { Tenant, TenantId } from "@/types/tenant";
import { DEFAULT_TENANT_CONFIG } from "@/config/tenant";

export const defaultOnboardingDraft = (): OnboardingDraft => ({
  restaurant: {
    name: "",
    slug: "",
    businessEmail: "",
    phone: "",
    logoPlaceholder: "",
    description: "",
  },
  business: {
    businessType: "",
    cuisineType: "",
    taxId: "",
    registrationNumber: "",
  },
  address: {
    country: "IN",
    state: "",
    city: "",
    address: "",
    postalCode: "",
  },
  regional: {
    currency: DEFAULT_TENANT_CONFIG.currency,
    timezone: DEFAULT_TENANT_CONFIG.timezone,
  },
  branding: {
    logoUrl: "",
    receiptLogoUrl: "",
    primaryColor: DEFAULT_TENANT_BRANDING.primaryColor,
    secondaryColor: DEFAULT_TENANT_BRANDING.secondaryColor,
    themePreference: DEFAULT_TENANT_BRANDING.themePreference,
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

export function getStepIndex(stepId: OnboardingStepId): number {
  return ONBOARDING_STEP_IDS.indexOf(stepId);
}

export function getNextStepId(
  stepId: OnboardingStepId
): OnboardingStepId | null {
  const index = getStepIndex(stepId);
  if (index < 0 || index >= ONBOARDING_STEP_IDS.length - 1) return null;
  return ONBOARDING_STEP_IDS[index + 1];
}

export function getPreviousStepId(
  stepId: OnboardingStepId
): OnboardingStepId | null {
  const index = getStepIndex(stepId);
  if (index <= 0) return null;
  return ONBOARDING_STEP_IDS[index - 1];
}

export function buildOnboardingReviewSections(
  draft: OnboardingDraft
): OnboardingReviewSection[] {
  const display = (value?: string) =>
    value && value.trim().length > 0 ? value : "—";

  return [
    {
      id: "restaurant",
      title: "Restaurant Information",
      fields: [
        { label: "Name", value: display(draft.restaurant.name) },
        { label: "Slug", value: display(draft.restaurant.slug) },
        { label: "Business Email", value: display(draft.restaurant.businessEmail) },
        { label: "Phone", value: display(draft.restaurant.phone) },
        { label: "Description", value: display(draft.restaurant.description) },
      ],
    },
    {
      id: "business",
      title: "Business Details",
      fields: [
        { label: "Business Type", value: display(draft.business.businessType) },
        { label: "Cuisine Type", value: display(draft.business.cuisineType) },
        { label: "GST / Tax ID", value: display(draft.business.taxId) },
        {
          label: "Registration Number",
          value: display(draft.business.registrationNumber),
        },
      ],
    },
    {
      id: "address",
      title: "Address",
      fields: [
        { label: "Country", value: display(draft.address.country) },
        { label: "State", value: display(draft.address.state) },
        { label: "City", value: display(draft.address.city) },
        { label: "Address", value: display(draft.address.address) },
        { label: "Postal Code", value: display(draft.address.postalCode) },
      ],
    },
    {
      id: "regional",
      title: "Currency & Timezone",
      fields: [
        { label: "Currency", value: display(draft.regional.currency) },
        { label: "Timezone", value: display(draft.regional.timezone) },
      ],
    },
    {
      id: "branding",
      title: "Branding",
      fields: [
        { label: "Primary Color", value: display(draft.branding.primaryColor) },
        {
          label: "Secondary Color",
          value: display(draft.branding.secondaryColor),
        },
        {
          label: "Theme Preference",
          value: display(draft.branding.themePreference),
        },
      ],
    },
  ];
}

export function draftToTenantPreview(
  draft: OnboardingDraft
): OnboardingTenantPreview {
  return {
    name: draft.restaurant.name,
    slug: draft.restaurant.slug,
    contact: {
      email: draft.restaurant.businessEmail,
      phone: draft.restaurant.phone,
    },
    address: { ...draft.address },
    business: { ...draft.business },
    metadata: {
      description: draft.restaurant.description || undefined,
    },
    branding: {
      logoUrl: draft.branding.logoUrl || undefined,
      receiptLogoUrl: draft.branding.receiptLogoUrl || undefined,
      primaryColor: draft.branding.primaryColor,
      secondaryColor: draft.branding.secondaryColor,
      themePreference: draft.branding.themePreference,
    },
    currency: draft.regional.currency,
    timezone: draft.regional.timezone,
  };
}

/** Map onboarding draft to a client-side Tenant placeholder (no persistence). */
export function draftToTenantPlaceholder(
  draft: OnboardingDraft,
  id?: TenantId
): Tenant {
  const preview = draftToTenantPreview(draft);
  const now = new Date().toISOString();

  return {
    id: id ?? `tenant-draft-${preview.slug || "pending"}`,
    name: preview.name,
    slug: preview.slug,
    contact: preview.contact,
    address: preview.address,
    business: preview.business,
    metadata: preview.metadata,
    config: {
      ...DEFAULT_TENANT_CONFIG,
      currency: preview.currency,
      timezone: preview.timezone,
      branding: {
        ...DEFAULT_TENANT_CONFIG.branding,
        ...preview.branding,
      },
    },
    branchIds: [],
    activeBranchId: null,
    createdAt: now,
    updatedAt: now,
  };
}
