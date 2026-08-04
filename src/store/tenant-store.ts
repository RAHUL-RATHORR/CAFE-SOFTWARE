"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TENANT_STORAGE_KEY } from "@/config/tenant";
import {
  createIsolationContext,
  mergeTenantConfig,
} from "@/lib/tenant";
import type {
  Tenant,
  TenantConfig,
  TenantId,
  TenantIsolationContext,
} from "@/types/tenant";

type TenantState = {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  isolation: TenantIsolationContext;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setCurrentTenant: (tenant: Tenant | null) => void;
  setTenants: (tenants: Tenant[]) => void;
  /** Restaurant switching placeholder — client state only */
  switchTenant: (tenantId: TenantId) => void;
  updateTenantConfig: (partial: Partial<TenantConfig>) => void;
  /** Apply a draft tenant from onboarding (no API) */
  applyOnboardingTenant: (tenant: Tenant) => void;
  clearTenant: () => void;
};

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      currentTenant: null,
      tenants: [],
      isolation: createIsolationContext(null),
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setCurrentTenant: (tenant) =>
        set({
          currentTenant: tenant,
          isolation: createIsolationContext(
            tenant?.id ?? null,
            tenant?.activeBranchId
          ),
        }),
      setTenants: (tenants) => set({ tenants }),
      switchTenant: (tenantId) => {
        const tenant = get().tenants.find((item) => item.id === tenantId);
        if (!tenant) return;
        set({
          currentTenant: tenant,
          isolation: createIsolationContext(
            tenant.id,
            tenant.activeBranchId
          ),
        });
      },
      updateTenantConfig: (partial) => {
        const current = get().currentTenant;
        if (!current) return;
        const next: Tenant = {
          ...current,
          config: mergeTenantConfig(current.config, partial),
          updatedAt: new Date().toISOString(),
        };
        set({
          currentTenant: next,
          tenants: get().tenants.map((t) => (t.id === next.id ? next : t)),
        });
      },
      applyOnboardingTenant: (tenant) => {
        const existing = get().tenants.filter((t) => t.id !== tenant.id);
        set({
          currentTenant: tenant,
          tenants: [...existing, tenant],
          isolation: createIsolationContext(tenant.id, tenant.activeBranchId),
        });
      },
      clearTenant: () =>
        set({
          currentTenant: null,
          isolation: createIsolationContext(null),
        }),
    }),
    {
      name: TENANT_STORAGE_KEY,
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        tenants: state.tenants,
        isolation: state.isolation,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
