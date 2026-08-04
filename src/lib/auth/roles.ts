import { APP_ROLES, APP_ROLE_LABELS } from "@/config/navigation/roles";

export { APP_ROLES, APP_ROLE_LABELS };

/**
 * Auth role foundation — labels only, no permission enforcement.
 */
export const authRoleFoundation = {
  roles: APP_ROLES,
  labels: APP_ROLE_LABELS,
} as const;
