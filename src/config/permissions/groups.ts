import type { PermissionGroup, PermissionKey } from "@/types/rbac";
import { permissionList } from "./registry";

function keysForGroup(groupId: PermissionGroup["id"]): PermissionKey[] {
  return permissionList
    .filter((permission) => permission.group === groupId)
    .map((permission) => permission.key);
}

export const permissionGroups: PermissionGroup[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Dashboard and workspace home",
    permissions: keysForGroup("overview"),
  },
  {
    id: "restaurant",
    label: "Restaurant",
    description: "Menu, categories, and restaurant profile",
    permissions: keysForGroup("restaurant"),
  },
  {
    id: "operations",
    label: "Operations",
    description: "Tables, orders, and kitchen",
    permissions: keysForGroup("operations"),
  },
  {
    id: "commerce",
    label: "Commerce",
    description: "Billing and payments",
    permissions: keysForGroup("commerce"),
  },
  {
    id: "people",
    label: "People",
    description: "Customers, staff, and attendance",
    permissions: keysForGroup("people"),
  },
  {
    id: "insights",
    label: "Insights",
    description: "Reports and exports",
    permissions: keysForGroup("insights"),
  },
  {
    id: "administration",
    label: "Administration",
    description: "Users, roles, settings, and subscription",
    permissions: keysForGroup("administration"),
  },
];
