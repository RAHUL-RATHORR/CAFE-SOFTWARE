"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { PageContainer } from "@/components/common/page-container";
import { AppCard } from "@/components/cards/app-card";
import { DsBadge } from "@/components/badges/ds-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import {
  assignPlan,
  upgradePlan,
  downgradePlan,
  cancelSubscription,
  renewSubscription,
} from "@/actions/subscription";
import {
  SAAS_FEATURE_LABELS,
  BILLING_CYCLE_LABELS,
  SAAS_STATUS_LABELS,
  SAAS_STATUS_VARIANTS,
} from "@/config/subscription";
import { formatMoney } from "@/lib/subscription";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type {
  RestaurantSubscription,
  SubscriptionPlanEntity,
} from "@/types/subscription";

type SubscriptionPlansViewProps = {
  plans: SubscriptionPlanEntity[];
  subscription: RestaurantSubscription | null;
  errorMessage?: string | null;
};

export function SubscriptionPlansView({
  plans,
  subscription,
  errorMessage,
}: SubscriptionPlansViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canManage = useHasPermission([
    "subscription.manage",
    "subscription.update",
    "plans.manage",
  ]);

  function handleAssign(plan: SubscriptionPlanEntity) {
    openConfirmDialog("publish", {
      title: `Activate “${plan.name}”?`,
      description:
        plan.trialDays > 0
          ? `Starts a ${plan.trialDays}-day trial, then ${formatMoney(plan.monthlyPrice, plan.currency)}/mo.`
          : `Assigns ${plan.name} at ${formatMoney(plan.monthlyPrice, plan.currency)}/mo.`,
      confirmLabel: "Activate",
      onConfirm: async () => {
        const result = await assignPlan({
          planId: plan.id,
          billingCycle: "monthly",
          startTrial: plan.trialDays > 0,
        });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Plan assigned", plan.name);
        router.refresh();
      },
    });
  }

  function handleChange(plan: SubscriptionPlanEntity) {
    if (!subscription) {
      handleAssign(plan);
      return;
    }
    const currentPrice =
      plans.find((p) => p.id === subscription.planId)?.monthlyPrice ?? 0;
    const isUpgrade = plan.monthlyPrice >= currentPrice;
    openConfirmDialog("publish", {
      title: `${isUpgrade ? "Upgrade" : "Downgrade"} to “${plan.name}”?`,
      description:
        "Payment gateway not connected — this updates local subscription foundations only.",
      confirmLabel: isUpgrade ? "Upgrade" : "Downgrade",
      onConfirm: async () => {
        const result = isUpgrade
          ? await upgradePlan({ planId: plan.id })
          : await downgradePlan({ planId: plan.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success(
          isUpgrade ? "Plan upgraded" : "Plan downgraded",
          plan.name
        );
        router.refresh();
      },
    });
  }

  function handleCancel() {
    openConfirmDialog("delete", {
      title: "Cancel subscription?",
      description: "Your license will be marked cancelled. No external billing.",
      confirmLabel: "Cancel plan",
      onConfirm: async () => {
        const result = await cancelSubscription({});
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Subscription cancelled");
        router.refresh();
      },
    });
  }

  function handleRenew() {
    startTransition(async () => {
      const result = await renewSubscription({});
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Subscription renewed", result.data.planName);
      router.refresh();
    });
  }

  return (
    <PageContainer
      title="Plans"
      description="Compare tiers, assign trials, and upgrade or downgrade."
      actions={
        <Link
          href="/subscription"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
        >
          Dashboard
        </Link>
      }
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {subscription ? (
          <AppCard
            title="Current subscription"
            description={`${subscription.planName || "Plan"} · ${BILLING_CYCLE_LABELS[subscription.billingCycle]}`}
            action={
              <DsBadge
                variant={SAAS_STATUS_VARIANTS[subscription.status]}
                size="sm"
              >
                {SAAS_STATUS_LABELS[subscription.status]}
              </DsBadge>
            }
          >
            {canManage.allowed ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={isPending}
                  onClick={handleRenew}
                >
                  Renew
                </Button>
                {subscription.status !== "cancelled" ? (
                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-xl"
                    disabled={isPending}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            ) : null}
          </AppCard>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = subscription?.planId === plan.id;
            return (
              <AppCard
                key={plan.id}
                title={plan.name}
                description={plan.description}
                action={
                  plan.isPopular ? (
                    <DsBadge variant="info" size="sm">
                      Popular
                    </DsBadge>
                  ) : null
                }
                className={cn(
                  isCurrent && "ring-2 ring-primary/40",
                  "h-full"
                )}
              >
                <p className="text-2xl font-semibold tracking-tight">
                  {formatMoney(plan.monthlyPrice, plan.currency)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /mo
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  or {formatMoney(plan.yearlyPrice, plan.currency)}/yr ·{" "}
                  {plan.trialDays} day trial
                </p>
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <li>Branches: {plan.maxBranches}</li>
                  <li>Users: {plan.maxUsers}</li>
                  <li>Orders/mo: {plan.maxOrdersPerMonth}</li>
                  <li>Menu items: {plan.maxMenuItems}</li>
                </ul>
                <div className="mt-3 flex flex-wrap gap-1">
                  {plan.features.slice(0, 6).map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1 rounded-lg bg-muted/60 px-2 py-0.5 text-[11px]"
                    >
                      <Check className="size-3 text-primary" />
                      {SAAS_FEATURE_LABELS[feature]}
                    </span>
                  ))}
                </div>
                {canManage.allowed ? (
                  <Button
                    type="button"
                    className="mt-4 w-full rounded-xl"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isPending || isCurrent}
                    onClick={() =>
                      subscription ? handleChange(plan) : handleAssign(plan)
                    }
                  >
                    {isCurrent
                      ? "Current plan"
                      : subscription
                        ? "Switch plan"
                        : "Start plan"}
                  </Button>
                ) : null}
              </AppCard>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
