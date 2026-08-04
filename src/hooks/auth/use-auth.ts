"use client";

import { signIn, signOut } from "next-auth/react";
import { useAuthSession } from "@/hooks/auth/use-auth-session";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import {
  AUTH_ROUTES,
  DEFAULT_AUTHENTICATED_REDIRECT,
} from "@/lib/auth/constants";
import { getSafeCallbackUrl } from "@/lib/auth/routing";

export function useAuth() {
  const sessionState = useAuthSession();
  const { user } = useCurrentUser();

  return {
    ...sessionState,
    user,
    login: async (input: {
      email: string;
      password: string;
      rememberMe?: boolean;
      callbackUrl?: string;
    }) => {
      const result = await signIn("credentials", {
        email: input.email,
        password: input.password,
        rememberMe: input.rememberMe ? "true" : "false",
        redirect: false,
        callbackUrl: getSafeCallbackUrl(
          input.callbackUrl,
          DEFAULT_AUTHENTICATED_REDIRECT
        ),
      });

      return result;
    },
    logout: async (options?: { callbackUrl?: string }) => {
      await signOut({
        callbackUrl: options?.callbackUrl ?? AUTH_ROUTES.login,
      });
    },
    /**
     * Session refresh placeholder — uses Auth.js client session update.
     */
    refreshSession: async () => {
      await sessionState.update();
    },
  };
}
