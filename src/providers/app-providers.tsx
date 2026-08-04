"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/theme-provider";
import { PreferencesProvider } from "@/providers/preferences-provider";
import { StateProvider } from "@/providers/state-provider";
import { FeedbackProvider } from "@/providers/feedback-provider";
import { SearchProvider } from "@/providers/search-provider";
import { AuthProvider } from "@/providers/auth";
import { TenantProvider } from "@/providers/tenant";

type AppProvidersProps = {
  children: ReactNode;
};

/**
 * Root provider composition for DineFlow.
 * Nest future providers here (query, i18n) without touching layouts.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TenantProvider>
          <PreferencesProvider>
            <StateProvider>
              <FeedbackProvider>
                <SearchProvider>
                  <TooltipProvider>{children}</TooltipProvider>
                </SearchProvider>
              </FeedbackProvider>
            </StateProvider>
          </PreferencesProvider>
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
