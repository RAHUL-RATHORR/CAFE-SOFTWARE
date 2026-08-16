"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { AppCard } from "@/components/cards/app-card";
import { DsBadge } from "@/components/badges/ds-badge";
import { formatAdminMoney } from "@/lib/admin";
import type { SubscriptionPlanEntity } from "@/types/subscription";

type AdminPlansViewProps = {
  plans: SubscriptionPlanEntity[];
  errorMessage?: string | null;
};

export function AdminPlansView({ plans, errorMessage }: AdminPlansViewProps) {
  return (
    <AdminShell
      title="Plans"
      description="Catalog of SaaS subscription plans (managed via subscription module)."
    >
      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <AppCard
            key={plan.id}
            title={plan.name}
            description={plan.description}
            action={
              plan.isPopular ? (
                <DsBadge variant="info" size="sm">
                  Popular
                </DsBadge>
              ) : (
                <DsBadge
                  variant={plan.isActive ? "success" : "secondary"}
                  size="sm"
                >
                  {plan.isActive ? "Active" : "Inactive"}
                </DsBadge>
              )
            }
          >
            <p className="text-2xl font-semibold">
              {formatAdminMoney(plan.monthlyPrice, plan.currency)}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </p>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              <li>Staff: {plan.maxStaff || plan.maxUsers}</li>
              <li>Branches: {plan.maxBranches}</li>
              <li>Tables: {plan.maxTables}</li>
              <li>Menu items: {plan.maxMenuItems}</li>
              <li>Features: {plan.features.length}</li>
            </ul>
          </AppCard>
        ))}
      </div>
    </AdminShell>
  );
}
