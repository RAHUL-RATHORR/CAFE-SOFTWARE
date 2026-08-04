"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useTenantStore } from "@/store/tenant-store";
import {
  getTenantCurrency,
  getTenantTheme,
  getTenantTimezone,
} from "@/lib/tenant";
import type { TenantContextValue } from "@/types/tenant";

const TenantContext = createContext<TenantContextValue | null>(null);

type TenantProviderProps = {
  children: ReactNode;
};

/**
 * Tenant context provider — current restaurant, config, and isolation.
 * No backend integration; state is client/localStorage only.
 */
export function TenantProvider({ children }: TenantProviderProps) {
  const currentTenant = useTenantStore((s) => s.currentTenant);
  const tenants = useTenantStore((s) => s.tenants);
  const isolation = useTenantStore((s) => s.isolation);
  const hasHydrated = useTenantStore((s) => s.hasHydrated);
  const switchTenant = useTenantStore((s) => s.switchTenant);
  const setCurrentTenant = useTenantStore((s) => s.setCurrentTenant);
  const updateTenantConfig = useTenantStore((s) => s.updateTenantConfig);
  const clearTenant = useTenantStore((s) => s.clearTenant);

  const value = useMemo<TenantContextValue>(
    () => ({
      currentTenant,
      tenants,
      config: currentTenant?.config ?? null,
      currency: getTenantCurrency(currentTenant),
      timezone: getTenantTimezone(currentTenant),
      theme: getTenantTheme(currentTenant),
      isolation,
      isReady: hasHydrated,
      switchTenant,
      setCurrentTenant,
      updateTenantConfig,
      clearTenant,
    }),
    [
      currentTenant,
      tenants,
      isolation,
      hasHydrated,
      switchTenant,
      setCurrentTenant,
      updateTenantConfig,
      clearTenant,
    ]
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenantContext(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenantContext must be used within TenantProvider");
  }
  return ctx;
}
