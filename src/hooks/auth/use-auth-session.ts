"use client";

import { useSession } from "next-auth/react";
import type { AuthSessionStatus } from "@/types/auth";

export function useAuthSession() {
  const session = useSession();

  const status: AuthSessionStatus =
    session.status === "loading"
      ? "loading"
      : session.status === "authenticated"
        ? "authenticated"
        : "unauthenticated";

  return {
    session: session.data,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isUnauthenticated: status === "unauthenticated",
    update: session.update,
  };
}
