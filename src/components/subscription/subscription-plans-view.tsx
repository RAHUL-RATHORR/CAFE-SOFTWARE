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
  reverseCancellation,
} from "@/actions/subscription";
import {
  SAAS_FEATURE_LABELS,
  BILLING_CYCLE_LABELS,
  SAAS_STATUS_LABELS,
  SAAS_STATUS_VARIANTS,
} from "@/config/subscription";
import { formatMoney, formatSubscriptionDate } from "@/lib/subscription";
import { SubscriptionStatusBanner } from "@/components/subscription/subscription-status-banner";
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
      title: `${isUpgrade ? "Upgrade" : "Downgrade"} to “${plan.displayName || plan.name}”?`,
      description: isUpgrade
        ? "Payment gateway is not connected yet. This updates your local subscription plan only — no payment is processed."
        : "If your current usage exceeds this plan’s limits, the change will be scheduled for the next billing period. Existing data will not be deleted.",
      confirmLabel: isUpgrade ? "Upgrade" : "Schedule / apply downgrade",
      onConfirm: async () => {
        const result = isUpgrade
          ? await upgradePlan({ planId: plan.id })
          : await downgradePlan({
              planId: plan.id,
              acknowledgeDowngradeLimits: true,
              scheduleAtPeriodEnd: true,
            });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success(
          isUpgrade
            ? "Plan upgraded"
            : result.data.pendingPlanChange
              ? "Downgrade scheduled"
              : "Plan downgraded",
          plan.displayName || plan.name
        );
        router.refresh();
      },
    });
  }

  function handleCancel() {
    openConfirmDialog("delete", {
      title: "Cancel subscription?",
      description:
        "Access continues until the current period ends. You can reverse cancellation before then. Restaurant data will not be deleted.",
      confirmLabel: "Cancel at period end",
      onConfirm: async () => {
        const result = await cancelSubscription({ cancelAtPeriodEnd: true });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success(
          "Cancellation scheduled",
          formatSubscriptionDate(
            result.data.currentPeriodEnd ?? result.data.renewalDate
          )
        );
        router.refresh();
      },
    });
  }

  function handleReverseCancel() {
    openConfirmDialog("publish", {
      title: "Keep your subscription?",
      description: "This reverses the scheduled cancellation.",
      confirmLabel: "Keep plan",
      onConfirm: async () => {
        const result = await reverseCancellation({});
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Cancellation reversed");
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
      toast.success(
        "Subscription period extended",
        "No payment was processed — provider is not configured."
      );
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

        <SubscriptionStatusBanner subscription={subscription} />

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
            <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Renews on</dt>
                <dd className="font-medium">
                  {formatSubscriptionDate(subscription.renewalDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Payment</dt>
                <dd className="font-medium">
                  {subscription.paymentStatus === "not_configured"
                    ? "Provider not configured"
                    : subscription.paymentStatus}
                </dd>
              </div>
            </dl>
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
                {subscription.cancelAtPeriodEnd ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-xl"
                    disabled={isPending}
                    onClick={handleReverseCancel}
                  >
                    Keep subscription
                  </Button>
                ) : subscription.status !== "cancelled" ? (
                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-xl"
                    disabled={isPending}
                    onClick={handleCancel}
                  >
                    Cancel subscription
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
                  <li>Staff: {plan.maxStaff || plan.maxUsers}</li>
                  <li>Tables: {plan.maxTables}</li>
                  <li>Menu items: {plan.maxMenuItems}</li>
                  <li>Customers: {plan.maxCustomers}</li>
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
