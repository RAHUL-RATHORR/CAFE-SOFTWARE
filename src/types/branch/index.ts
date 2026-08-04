/**
 * Branch / outlet types for multi-branch restaurant support.
 * Architecture only — no CRUD or API binding.
 */

export const BRANCH_STATUSES = [
  "active",
  "inactive",
  "coming-soon",
  "temporarily-closed",
] as const;

export type BranchStatus = (typeof BRANCH_STATUSES)[number];

export type BranchCoordinates = {
  latitude?: number | null;
  longitude?: number | null;
};

export type BranchOpeningHoursDay = {
  day:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  open?: string;
  close?: string;
  isClosed?: boolean;
};

/** Business hours placeholder structure */
export type BranchOpeningHours = {
  timezone?: string;
  days: BranchOpeningHoursDay[];
  notes?: string;
};

export type BranchAddress = {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

export type BranchContact = {
  email: string;
  phone: string;
};

export type BranchSettings = {
  timezone: string;
  currency: string;
  openingHours?: BranchOpeningHours;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  /** Future placeholders */
  taxesEnabled?: boolean;
  receiptFooter?: string;
  devicesPlaceholder?: string[];
};

export type Branch = {
  id: string;
  restaurantId: string;
  name: string;
  branchCode: string;
  email: string;
  phone: string;
  /** Placeholder — no user binding yet */
  managerId?: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  timezone: string;
  currency: string;
  status: BranchStatus;
  openingHours?: BranchOpeningHours;
  coordinates?: BranchCoordinates;
  isMainBranch: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BranchSummary = {
  id: string;
  name: string;
  branchCode: string;
  city: string;
  status: BranchStatus;
  isMainBranch: boolean;
  restaurantId: string;
};

export type BranchSwitcherOption = {
  id: string;
  name: string;
  branchCode: string;
  city?: string;
  status: BranchStatus;
  isMainBranch: boolean;
  isActive?: boolean;
};

/** Future role placeholders — not wired into AppRole auth yet */
export type BranchRolePlaceholder = "branch-manager" | "branch-staff";

export type BranchAccessPlaceholder = {
  branchId: string;
  role: BranchRolePlaceholder;
  /** Future: permission keys scoped to this branch */
  permissions?: string[];
};
