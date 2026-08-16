"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AppCard } from "@/components/cards/app-card";
import { Button } from "@/components/ui/button";
import { DsBadge } from "@/components/badges/ds-badge";
import {
  adminAssignPlan,
  adminCancelSubscription,
  adminDowngradePlan,
  adminExtendTrial,
  adminRenewSubscription,
  adminUpgradePlan,
} from "@/actions/admin";
import { formatAdminMoney } from "@/lib/admin";
import { toast } from "@/store/toast-store";
import type { AdminTenantSummary } from "@/types/admin";
import type { SubscriptionPlanEntity } from "@/types/subscription";

type AdminSubscriptionsViewProps = {
  tenants: AdminTenantSummary[];
  plans: SubscriptionPlanEntity[];
  selectedRestaurantId?: string;
  errorMessage?: string | null;
};

export function AdminSubscriptionsView({
  tenants,
  plans,
  selectedRestaurantId,
  errorMessage,
}: AdminSubscriptionsViewProps) {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState(
    selectedRestaurantId || tenants[0]?.id || ""
  );
  const [planId, setPlanId] = useState(plans[0]?.id || "");
  const [isPending, startTransition] = useTransition();

  const selected = useMemo(
    () => tenants.find((tenant) => tenant.id === restaurantId) ?? null,
    [tenants, restaurantId]
  );

  function run(
    label: string,
    action: () => Promise<{ success: boolean; error?: { message: string } }>
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast.error(result.error?.message ?? "Action failed");
        return;
      }
      toast.success(label);
      router.refresh();
    });
  }

  return (
    <AdminShell
      title="Subscriptions"
      description="Assign, upgrade, renew, cancel, and extend trials across tenants."
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <AppCard title="Tenant subscription controls">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Restaurant</span>
              <select
                className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                value={restaurantId}
                onChange={(event) => setRestaurantId(event.target.value)}
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Plan</span>
              <select
                className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                value={planId}
                onChange={(event) => setPlanId(event.target.value)}
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({formatAdminMoney(plan.monthlyPrice, plan.currency)}/mo)
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selected ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span>Current:</span>
              <DsBadge variant="info" size="sm">
                {selected.saasPlanName ?? selected.subscriptionPlan}
              </DsBadge>
              <DsBadge variant="secondary" size="sm">
                {selected.saasStatus ?? selected.subscriptionStatus}
              </DsBadge>
              <span className="text-muted-foreground">
                {selected.userCount} users · {selected.branchCount} branches ·{" "}
                {selected.storageUsage} MB
              </span>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-xl"
              disabled={isPending || !restaurantId || !planId}
              onClick={() =>
                run("Plan assigned", () =>
                  adminAssignPlan({
                    restaurantId,
                    planId,
                    billingCycle: "monthly",
                    startTrial: true,
                  })
                )
              }
            >
              Assign + trial
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isPending || !restaurantId || !planId}
              onClick={() =>
                run("Upgraded", () =>
                  adminUpgradePlan({ restaurantId, planId, mode: "upgrade" })
                )
              }
            >
              Upgrade
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isPending || !restaurantId || !planId}
              onClick={() =>
                run("Downgraded", () =>
                  adminDowngradePlan({
                    restaurantId,
                    planId,
                    mode: "downgrade",
                  })
                )
              }
            >
              Downgrade
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isPending || !restaurantId}
              onClick={() =>
                run("Renewed", () => adminRenewSubscription({ restaurantId }))
              }
            >
              Renew
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={isPending || !restaurantId}
              onClick={() =>
                run("Trial extended", () =>
                  adminExtendTrial({ restaurantId, days: 7 })
                )
              }
            >
              Extend trial +7d
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={isPending || !restaurantId}
              onClick={() =>
                run("Cancelled", () =>
                  adminCancelSubscription({ restaurantId })
                )
              }
            >
              Cancel
            </Button>
          </div>
        </AppCard>

        <AppCard
          title="Subscription overview"
          description="Restaurant, plan, status, trial, and renewal foundations"
        >
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-3 py-2">Restaurant</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Usage</th>
                </tr>
              </thead>
              <tbody>
                {tenants.slice(0, 20).map((tenant) => (
                  <tr key={tenant.id} className="border-b border-border/50">
                    <td className="px-3 py-2 font-medium">{tenant.name}</td>
                    <td className="px-3 py-2">
                      {tenant.saasPlanName ?? tenant.subscriptionPlan}
                    </td>
                    <td className="px-3 py-2">
                      <DsBadge variant="secondary" size="sm">
                        {tenant.saasStatus ?? tenant.subscriptionStatus}
                      </DsBadge>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {tenant.userCount} staff · {tenant.branchCount} branches ·{" "}
                      {tenant.orderCount} orders
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AppCard>
      </div>
    </AdminShell>
  );
}
