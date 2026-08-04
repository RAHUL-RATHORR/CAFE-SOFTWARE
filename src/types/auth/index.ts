import type { AppRole } from "@/types/navigation";

export type { AppRole };

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  /** Multi-tenant placeholder — null until restaurant binding exists */
  restaurantId: string | null;
  image?: string | null;
};

export type AuthSessionStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated";

export type AuthErrorCode =
  | "invalid_credentials"
  | "session_expired"
  | "unauthorized"
  | "forbidden"
  | "network_error"
  | "unknown";

export type AuthRouteKind =
  | "public"
  | "guest"
  | "protected"
  | "admin"
  | "restaurant";

export type RouteProtectionConfig = {
  kind: AuthRouteKind;
  /** Role placeholder — not enforced yet */
  roles?: AppRole[];
  /** Permission placeholder — not enforced yet */
  permissions?: string[];
};

export type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type ForgotPasswordFormValues = {
  email: string;
};

export type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export type ChangePasswordFormValues = {
  currentPassword: string;
  password: string;
  confirmPassword: string;
};
