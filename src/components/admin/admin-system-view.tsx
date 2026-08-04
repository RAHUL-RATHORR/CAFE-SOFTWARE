"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatCard } from "@/components/cards/stat-card";
import { AppCard } from "@/components/cards/app-card";
import { DsBadge } from "@/components/badges/ds-badge";
import { formatAdminDate } from "@/lib/admin";
import type { AdminSystemHealth } from "@/types/admin";
import { Database, Server, HardDrive } from "lucide-react";

type AdminSystemViewProps = {
  health: AdminSystemHealth;
  errorMessage?: string | null;
};

export function AdminSystemView({
  health,
  errorMessage,
}: AdminSystemViewProps) {
  return (
    <AdminShell
      title="System health"
      description="Operational status placeholders — no cloud monitoring integration."
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Database"
            value={health.databaseStatus}
            accent={health.databaseStatus === "ok" ? "success" : "danger"}
            icon={<Database className="size-4" />}
          />
          <StatCard
            title="Application"
            value={health.applicationStatus}
            accent="success"
            icon={<Server className="size-4" />}
          />
          <StatCard
            title="Storage"
            value={health.storageStatusPlaceholder}
            description="Placeholder"
            accent="warning"
            icon={<HardDrive className="size-4" />}
          />
          <StatCard
            title="Error rate"
            value={`${health.errorRatePlaceholder}%`}
            description="Placeholder"
            accent="primary"
          />
          <StatCard
            title="Server uptime"
            value={health.serverUptimePlaceholder}
            description="Placeholder"
            accent="primary"
          />
          <StatCard
            title="Checked at"
            value={formatAdminDate(health.checkedAt)}
            accent="primary"
          />
        </div>

        <AppCard title="Latest deployments" description="Placeholder list">
          <ul className="space-y-2 text-sm">
            {health.latestDeploymentsPlaceholder.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2"
              >
                <span>{item.label}</span>
                <DsBadge variant="secondary" size="sm">
                  {formatAdminDate(item.at)}
                </DsBadge>
              </li>
            ))}
          </ul>
        </AppCard>
      </div>
    </AdminShell>
  );
}
