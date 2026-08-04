import type { NextAuthConfig } from "next-auth";
import { AUTH_ROUTES } from "@/lib/auth/constants";
import {
  SESSION_MAX_AGE_DEFAULT,
  SESSION_MAX_AGE_REMEMBER,
  authSecurityConfig,
} from "@/lib/auth/security";

const useSecureCookies =
  process.env.NODE_ENV === "production" ||
  process.env.AUTH_URL?.startsWith("https://") === true;

/**
 * Edge-compatible Auth.js config (no Node-only providers/adapters here).
 * Route gating is handled in middleware + server helpers.
 */
export const authConfig = {
  pages: {
    signIn: AUTH_ROUTES.login,
    error: AUTH_ROUTES.login,
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_REMEMBER,
    updateAge: 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? "__Secure-" : ""}authjs.session-token`,
      options: {
        httpOnly: authSecurityConfig.cookies.httpOnly,
        sameSite: authSecurityConfig.cookies.sameSite,
        path: authSecurityConfig.cookies.path,
        secure: useSecureCookies,
      },
    },
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.restaurantId = user.restaurantId ?? null;
        token.rememberMe = Boolean(user.rememberMe);

        const maxAge = token.rememberMe
          ? SESSION_MAX_AGE_REMEMBER
          : SESSION_MAX_AGE_DEFAULT;
        token.maxAge = maxAge;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
      }

      // Future refresh / sliding session hook point
      const issuedAt =
        typeof token.iat === "number" ? token.iat : undefined;
      const maxAge =
        typeof token.maxAge === "number" ? token.maxAge : undefined;
      if (issuedAt != null && maxAge != null) {
        const expiresAt = issuedAt + maxAge;
        if (typeof token.exp !== "number" || token.exp > expiresAt) {
          token.exp = expiresAt;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.role =
          (token.role as typeof session.user.role) ?? "manager";
        session.user.restaurantId =
          (token.restaurantId as string | null | undefined) ?? null;
      }
      session.rememberMe = Boolean(token.rememberMe);
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
