import type { SelectOption } from "@/types";

export const businessTypeOptions: SelectOption[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Café" },
  { value: "bakery", label: "Bakery" },
  { value: "bar", label: "Bar & Lounge" },
  { value: "cloud-kitchen", label: "Cloud Kitchen" },
  { value: "quick-service", label: "Quick Service" },
  { value: "other", label: "Other" },
];

export const cuisineTypeOptions: SelectOption[] = [
  { value: "multi-cuisine", label: "Multi Cuisine" },
  { value: "indian", label: "Indian" },
  { value: "italian", label: "Italian" },
  { value: "chinese", label: "Chinese" },
  { value: "continental", label: "Continental" },
  { value: "asian", label: "Asian" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "other", label: "Other" },
];

export const currencyOptions: SelectOption[] = [
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
];

export const timezoneOptions: SelectOption[] = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET)" },
  { value: "America/New_York", label: "America/New_York (ET)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PT)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST)" },
];

export const themePreferenceOptions: SelectOption[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export const countryOptions: SelectOption[] = [
  { value: "IN", label: "India" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "SG", label: "Singapore" },
  { value: "AU", label: "Australia" },
  { value: "CA", label: "Canada" },
  { value: "OTHER", label: "Other" },
];
