import type { Branch } from "@/types/branch";

export const BRANCH_STORAGE_KEY = "dineflow-branch";

export const BRANCH_STATUS_LABELS = {
  active: "Active",
  inactive: "Inactive",
  "coming-soon": "Coming soon",
  "temporarily-closed": "Temporarily closed",
} as const;

/** Dummy branches for UI / switcher — no server fetch */
export const DUMMY_BRANCHES: Branch[] = [
  {
    id: "branch-main",
    restaurantId: "restaurant-demo",
    name: "Downtown Flagship",
    branchCode: "DT-01",
    email: "downtown@dineflow.local",
    phone: "+91 98765 10001",
    managerId: null,
    address: "12 Marine Drive",
    city: "Mumbai",
    state: "Maharashtra",
    country: "IN",
    postalCode: "400001",
    timezone: "Asia/Kolkata",
    currency: "INR",
    status: "active",
    isMainBranch: true,
    openingHours: {
      timezone: "Asia/Kolkata",
      days: [
        { day: "monday", open: "09:00", close: "22:00" },
        { day: "tuesday", open: "09:00", close: "22:00" },
        { day: "wednesday", open: "09:00", close: "22:00" },
        { day: "thursday", open: "09:00", close: "22:00" },
        { day: "friday", open: "09:00", close: "23:00" },
        { day: "saturday", open: "10:00", close: "23:00" },
        { day: "sunday", open: "10:00", close: "21:00" },
      ],
      notes: "Hours placeholder — not enforced",
    },
    coordinates: { latitude: 18.9432, longitude: 72.8236 },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "branch-suburb",
    restaurantId: "restaurant-demo",
    name: "Bandra Outlet",
    branchCode: "BN-02",
    email: "bandra@dineflow.local",
    phone: "+91 98765 10002",
    managerId: null,
    address: "45 Linking Road",
    city: "Mumbai",
    state: "Maharashtra",
    country: "IN",
    postalCode: "400050",
    timezone: "Asia/Kolkata",
    currency: "INR",
    status: "active",
    isMainBranch: false,
    openingHours: {
      timezone: "Asia/Kolkata",
      days: [],
      notes: "",
    },
    coordinates: { latitude: 19.0596, longitude: 72.8295 },
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "branch-airport",
    restaurantId: "restaurant-demo",
    name: "Airport Kiosk",
    branchCode: "AP-03",
    email: "airport@dineflow.local",
    phone: "+91 98765 10003",
    managerId: null,
    address: "T2 Food Court",
    city: "Mumbai",
    state: "Maharashtra",
    country: "IN",
    postalCode: "400099",
    timezone: "Asia/Kolkata",
    currency: "INR",
    status: "coming-soon",
    isMainBranch: false,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
];

export const branchSettingsSections = [
  {
    id: "general",
    title: "General",
    description: "Branch identity and status",
    href: "/settings/branches/general",
  },
  {
    id: "address",
    title: "Address",
    description: "Location and postal details",
    href: "/settings/branches/address",
  },
  {
    id: "business-hours",
    title: "Business Hours",
    description: "Opening hours placeholder",
    href: "/settings/branches/business-hours",
  },
  {
    id: "branding",
    title: "Branding",
    description: "Branch-level brand placeholders",
    href: "/settings/branches/branding",
  },
  {
    id: "taxes",
    title: "Taxes",
    description: "Tax configuration placeholder",
    href: "/settings/branches/taxes",
  },
  {
    id: "receipt",
    title: "Receipt",
    description: "Receipt settings placeholder",
    href: "/settings/branches/receipt",
  },
  {
    id: "devices",
    title: "Devices",
    description: "POS and device placeholders",
    href: "/settings/branches/devices",
  },
] as const;

export type BranchSettingsSectionId =
  (typeof branchSettingsSections)[number]["id"];
