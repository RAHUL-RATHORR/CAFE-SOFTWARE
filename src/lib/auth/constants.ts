export const AUTH_ROUTES = {
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
} as const;

export const DEFAULT_AUTHENTICATED_REDIRECT = "/dashboard";
export const DEFAULT_UNAUTHENTICATED_REDIRECT = AUTH_ROUTES.login;

/** Guest-only paths (redirect away when already signed in) */
export const GUEST_ROUTES: string[] = [
  AUTH_ROUTES.login,
  AUTH_ROUTES.forgotPassword,
  AUTH_ROUTES.resetPassword,
];

/**
 * Protected app prefixes. Nested paths under these require a session.
 * Architecture only for roles/permissions — enforcement is session-based today.
 */
export const PROTECTED_ROUTE_PREFIXES: string[] = [
  "/dashboard",
  "/first-login",
  "/categories",
  "/menu-items",
  "/tables",
  "/branches",
  "/orders",
  "/kitchen",
  "/billing",
  "/customers",
  "/vendors",
  "/purchases",
  "/staff",
  "/shifts",
  "/reports",
  "/subscription",
  "/settings",
  "/administration",
  "/admin",
  "/restaurant",
  "/onboarding",
  "/notifications",
  "/announcements",
  "/activity",
];

/** Admin area prefixes — role enforcement is a future middleware concern */
export const ADMIN_ROUTE_PREFIXES: string[] = ["/administration", "/admin"];

/** Restaurant-scoped prefixes — tenant binding enforcement is future work */
export const RESTAURANT_ROUTE_PREFIXES: string[] = [
  "/restaurant",
  "/categories",
  "/menu-items",
  "/tables",
  "/branches",
  "/orders",
  "/kitchen",
  "/billing",
  "/customers",
  "/vendors",
  "/purchases",
  "/staff",
  "/shifts",
  "/reports",
  "/subscription",
];

/** Explicitly public paths (no session required) */
export const PUBLIC_ROUTES: string[] = ["/menu", "/order", "/api/health"];

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid email or password. Please try again.",
  session_expired: "Your session has expired. Please sign in again.",
  unauthorized: "You do not have permission to access this resource.",
  forbidden: "Access to this resource is forbidden.",
  network_error: "Network error. Check your connection and try again.",
  CredentialsSignin: "Invalid email or password. Please try again.",
  SessionRequired: "Your session has expired. Please sign in again.",
  AccessDenied: "You do not have permission to access this resource.",
  Configuration: "Authentication is misconfigured. Contact support.",
  Default: "Something went wrong while signing in. Please try again.",
};
