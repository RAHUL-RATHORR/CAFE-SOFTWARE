"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AppCard } from "@/components/cards/app-card";
import { DsBadge } from "@/components/badges/ds-badge";
import { Button } from "@/components/ui/button";
import { toggleAdminFeatureFlag } from "@/actions/admin";
import { FEATURE_FLAG_SCOPE_LABELS } from "@/config/admin";
import { formatAdminDate } from "@/lib/admin";
import { toast } from "@/store/toast-store";
import type { PlatformFeatureFlag } from "@/types/admin";

type AdminSettingsViewProps = {
  flags: PlatformFeatureFlag[];
  errorMessage?: string | null;
};

export function AdminSettingsView({
  flags,
  errorMessage,
}: AdminSettingsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle(flag: PlatformFeatureFlag) {
    startTransition(async () => {
      const result = await toggleAdminFeatureFlag({
        id: flag.id,
        enabled: !flag.enabled,
      });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success(
        result.data.enabled ? "Flag enabled" : "Flag disabled",
        result.data.key
      );
      router.refresh();
    });
  }

  return (
    <AdminShell
      title="Admin settings"
      description="Centralized feature flags — global, plan, tenant, beta, and early access."
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <AppCard
          title="Feature flags"
          description="Enable / disable modules and beta features"
          contentClassName="space-y-3"
        >
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="flex flex-col gap-3 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{flag.label}</p>
                  <DsBadge variant="secondary" size="sm">
                    {FEATURE_FLAG_SCOPE_LABELS[flag.scope]}
                  </DsBadge>
                  {flag.isBeta ? (
                    <DsBadge variant="warning" size="sm">
                      Beta
                    </DsBadge>
                  ) : null}
                  {flag.isEarlyAccess ? (
                    <DsBadge variant="info" size="sm">
                      Early access
                    </DsBadge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {flag.description || flag.key}
                </p>
                <p className="text-xs text-muted-foreground">
                  Updated {formatAdminDate(flag.updatedAt)}
                </p>
              </div>
              <Button
                type="button"
                variant={flag.enabled ? "default" : "outline"}
                className="rounded-xl"
                disabled={isPending}
                onClick={() => toggle(flag)}
              >
                {flag.enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>
          ))}
        </AppCard>
      </div>
    </AdminShell>
  );
}
