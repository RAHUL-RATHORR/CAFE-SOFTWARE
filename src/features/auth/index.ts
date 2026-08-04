export {
  LoginForm,
  ForgotPasswordForm,
  ResetPasswordForm,
  AuthError,
  AuthGuard,
  GuestGuard,
  RoleGuard,
  AdminGuard,
  RestaurantGuard,
} from "@/components/auth";

export { useAuth, useAuthSession, useCurrentUser } from "@/hooks/auth";

export {
  auth,
  signIn,
  signOut,
  getCurrentUser,
  requireAuth,
  isAuthenticated,
  logout,
  hasPermission,
  authSecurityConfig,
} from "@/lib/auth";

export {
  usePermissions,
  useRole,
  useCanAccess,
  useHasPermission,
} from "@/hooks/rbac";

export {
  PermissionGuard,
  RoleGuard as RbacRoleGuard,
  FeatureGuard,
  RouteGuard,
} from "@/components/rbac";
