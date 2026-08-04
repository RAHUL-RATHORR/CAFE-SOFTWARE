import {
  CircleHelp,
  CreditCard,
  GitBranch,
  Keyboard,
  LifeBuoy,
  LogOut,
  Plus,
  Settings,
  Shield,
  User,
  Zap,
} from "lucide-react";
import { DASHBOARD_HREF } from "@/config/routes";
import type { MenuItem } from "@/types/navigation";

/** Top / secondary navigation placeholders */
export const topNavigation: MenuItem[] = [
  {
    id: "top-dashboard",
    label: "Dashboard",
    href: DASHBOARD_HREF,
    route: "dashboard",
  },
  {
    id: "top-orders",
    label: "Orders",
    href: "/orders",
    route: "orders",
  },
  {
    id: "top-reports",
    label: "Reports",
    href: "/reports",
    route: "reports",
  },
];

/** Quick action placeholders (command palette / toolbar ready) */
export const quickActionsNavigation: MenuItem[] = [
  {
    id: "qa-new-order",
    label: "New Order",
    href: "/orders",
    route: "orders",
    icon: Plus,
    description: "Start a new order (placeholder)",
  },
  {
    id: "qa-kitchen",
    label: "Open Kitchen",
    href: "/kitchen",
    route: "kitchen",
    icon: Zap,
  },
  {
    id: "qa-billing",
    label: "Billing",
    href: "/billing",
    route: "billing",
    icon: CreditCard,
  },
];

/** Footer navigation placeholders */
export const footerNavigation: MenuItem[] = [
  {
    id: "footer-help",
    label: "Help Center",
    href: "#help",
    icon: LifeBuoy,
    disabled: true,
  },
  {
    id: "footer-shortcuts",
    label: "Keyboard Shortcuts",
    href: "#shortcuts",
    icon: Keyboard,
    disabled: true,
  },
];

/** User menu placeholders — no auth */
export const userMenuNavigation: MenuItem[] = [
  {
    id: "user-profile",
    label: "Profile",
    href: "#profile",
    icon: User,
    disabled: true,
  },
  {
    id: "user-settings",
    label: "Settings",
    href: "/settings",
    route: "settings",
    icon: Settings,
    dividerAfter: true,
  },
  {
    id: "user-sign-out",
    label: "Sign out",
    href: "#sign-out",
    icon: LogOut,
    disabled: true,
  },
];

/** Settings submenu placeholders */
export const settingsMenuNavigation: MenuItem[] = [
  {
    id: "settings-general",
    label: "General",
    href: "/settings",
    route: "settings",
    icon: Settings,
  },
  {
    id: "settings-preferences",
    label: "Preferences",
    href: "/settings",
    route: "settings",
    description: "Maps to settings until nested route exists",
  },
  {
    id: "settings-branches",
    label: "Branches",
    href: "/settings/branches",
    route: "settings-branches",
    icon: GitBranch,
    description: "Outlet management foundation",
    permission: {
      roles: ["super-admin", "restaurant-owner", "manager"],
      permissions: ["branches.view"],
    },
  },
];

/** Help menu placeholders */
export const helpMenuNavigation: MenuItem[] = [
  {
    id: "help-docs",
    label: "Documentation",
    href: "#docs",
    icon: CircleHelp,
    disabled: true,
  },
  {
    id: "help-support",
    label: "Contact Support",
    href: "#support",
    icon: LifeBuoy,
    disabled: true,
  },
];

/** Future admin menu — hidden from UI until enabled */
export const adminMenuNavigation: MenuItem[] = [
  {
    id: "admin-console",
    label: "Admin Console",
    href: "/administration",
    route: "administration",
    icon: Shield,
    featureFlag: { flag: "admin-console", defaultEnabled: false },
    permission: { roles: ["super-admin"] },
    disabled: true,
  },
];

export const navigationMenus = {
  sidebar: "sidebar" as const,
  top: topNavigation,
  quickActions: quickActionsNavigation,
  footer: footerNavigation,
  user: userMenuNavigation,
  settings: settingsMenuNavigation,
  help: helpMenuNavigation,
  admin: adminMenuNavigation,
};
