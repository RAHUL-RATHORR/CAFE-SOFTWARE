import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth/auth";
import {
  AUTH_ROUTES,
  DEFAULT_AUTHENTICATED_REDIRECT,
  DEFAULT_UNAUTHENTICATED_REDIRECT,
} from "@/lib/auth/constants";
import { hasPermission, hasRole } from "@/lib/auth/permissions";
import type { AppRole, PermissionPlaceholder } from "@/types/navigation";

export async function getServerSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return Boolean(session?.user);
}

/**
 * Server-side session gate for protected layouts/pages.
 */
export async function requireAuth(options?: {
  redirectTo?: string;
  callbackUrl?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    const target = options?.redirectTo ?? DEFAULT_UNAUTHENTICATED_REDIRECT;
    const callback = options?.callbackUrl
      ? `?callbackUrl=${encodeURIComponent(options.callbackUrl)}`
      : "";
    redirect(`${target}${callback}`);
  }
  return session;
}

/**
 * Server-side guest gate for auth pages.
 */
export async function requireGuest(options?: { redirectTo?: string }) {
  const session = await auth();
  if (session?.user) {
    redirect(options?.redirectTo ?? DEFAULT_AUTHENTICATED_REDIRECT);
  }
  return null;
}

/**
 * Role check — requires session and matching role.
 */
export async function requireRole(roles: AppRole[]) {
  const session = await requireAuth();
  if (!hasRole(session.user.role, roles)) {
    redirect(DEFAULT_AUTHENTICATED_REDIRECT);
  }
  return session;
}

/**
 * Permission check — requires session and matching permission.
 */
export async function requirePermission(
  permission: PermissionPlaceholder | string | string[]
) {
  const session = await requireAuth();
  if (!hasPermission(permission, session.user.role)) {
    redirect(DEFAULT_AUTHENTICATED_REDIRECT);
  }
  return session;
}

/**
 * Server-side logout helper.
 */
export async function logout(options?: { redirectTo?: string }) {
  await signOut({
    redirectTo: options?.redirectTo ?? AUTH_ROUTES.login,
  });
}

/**
 * Session refresh placeholder — wire sliding/refresh strategy later.
 * Clients should prefer `useAuth().refreshSession`.
 */
export async function refreshSessionPlaceholder() {
  const session = await auth();
  return session;
}
