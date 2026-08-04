"use client";

import { useMemo } from "react";
import { useAuthSession } from "@/hooks/auth/use-auth-session";
import type { AuthUser } from "@/types/auth";

export function useCurrentUser(): {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
} {
  const { session, isLoading, isAuthenticated } = useAuthSession();

  const sessionUser = session?.user;

  const user = useMemo<AuthUser | null>(() => {
    if (!sessionUser) return null;
    return {
      id: sessionUser.id,
      email: sessionUser.email ?? "",
      name: sessionUser.name ?? "",
      role: sessionUser.role,
      restaurantId: sessionUser.restaurantId,
      image: sessionUser.image,
    };
  }, [sessionUser]);

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user) && isAuthenticated,
  };
}
