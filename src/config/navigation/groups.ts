import type { NavigationGroup } from "@/types/navigation";

/**
 * Menu groups for sidebar/section organization.
 * Flat sidebar still uses mainNavigation; groups are ready for grouped UIs.
 */
export const navigationGroups: NavigationGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Overview and home",
    routes: ["dashboard"],
    order: 10,
  },
  {
    id: "restaurant",
    label: "Restaurant",
    description: "Menu, categories, and floor",
    routes: ["categories", "menu-items", "tables", "branches"],
    order: 20,
  },
  {
    id: "operations",
    label: "Operations",
    description: "Orders, kitchen, and billing",
    routes: ["orders", "kitchen", "billing"],
    order: 30,
  },
  {
    id: "management",
    label: "Management",
    description: "Customers, vendors, procurement, and staff",
    routes: ["customers", "vendors", "purchases", "staff", "shifts"],
    order: 40,
  },
  {
    id: "reports",
    label: "Reports",
    description: "Analytics and reporting",
    routes: ["reports"],
    order: 50,
  },
  {
    id: "administration",
    label: "Administration",
    description: "Platform admin",
    routes: ["admin", "administration"],
    order: 60,
  },
  {
    id: "settings",
    label: "Settings",
    description: "Preferences and configuration",
    routes: [
      "notifications",
      "announcements",
      "activity",
      "settings",
      "settings-preferences",
      "settings-branches",
      "subscription",
    ],
    order: 70,
  },
];

export function getNavigationGroup(id: NavigationGroup["id"]) {
  return navigationGroups.find((group) => group.id === id);
}
