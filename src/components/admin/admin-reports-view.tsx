"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AppCard } from "@/components/cards/app-card";
import { StatCard } from "@/components/cards/stat-card";
import { ReportBarChart } from "@/components/reports/report-charts";
import { Button } from "@/components/ui/button";
import { getAdminReport } from "@/actions/admin";
import type { AdminGlobalReport } from "@/types/admin";
import { useState } from "react";

const KINDS: AdminGlobalReport["kind"][] = [
  "revenue",
  "tenant-growth",
  "subscription-growth",
  "user-growth",
  "restaurant-growth",
  "platform-usage",
  "storage-usage",
  "api-usage",
];

type AdminReportsViewProps = {
  initialReport: AdminGlobalReport;
  errorMessage?: string | null;
};

export function AdminReportsView({
  initialReport,
  errorMessage,
}: AdminReportsViewProps) {
  const router = useRouter();
  const [report, setReport] = useState(initialReport);
  const [isPending, startTransition] = useTransition();

  function load(kind: AdminGlobalReport["kind"]) {
    startTransition(async () => {
      const result = await getAdminReport(kind);
      if (result.success) {
        setReport(result.data);
        router.replace(`/admin/reports?kind=${kind}`);
      }
    });
  }

  return (
    <AdminShell
      title="Global reports"
      description="Platform-wide growth, revenue, and usage reports."
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {KINDS.map((kind) => (
            <Button
              key={kind}
              type="button"
              size="sm"
              variant={report.kind === kind ? "default" : "outline"}
              className="rounded-xl"
              disabled={isPending}
              onClick={() => load(kind)}
            >
              {kind}
            </Button>
          ))}
        </div>

        <AppCard title={report.title} description={report.description}>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {report.kpis.map((kpi) => (
              <StatCard
                key={kpi.id}
                title={kpi.title}
                value={kpi.value}
                accent="primary"
              />
            ))}
          </div>
          <ReportBarChart
            points={report.series.map((point) => ({
              label: point.label,
              value: point.value,
            }))}
          />
        </AppCard>
      </div>
    </AdminShell>
  );
}
