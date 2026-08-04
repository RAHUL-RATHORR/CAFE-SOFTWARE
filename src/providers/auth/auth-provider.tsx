"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * Client SessionProvider wrapper for Auth.js.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
