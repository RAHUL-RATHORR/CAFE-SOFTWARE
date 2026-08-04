"use client";

import { PageContainer } from "@/components/common/page-container";
import { StatCard } from "@/components/cards/stat-card";
import { AppCard } from "@/components/cards/app-card";
import { ReportFiltersBar } from "@/components/reports/report-filters-bar";
import { ReportChart } from "@/components/reports/report-charts";
import { Pagination } from "@/components/tables/pagination";
import { PageSizeSelector } from "@/components/tables/page-size-selector";
import { TableEmptyState } from "@/components/tables/table-empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import type { ModuleReportData } from "@/types/report";

type ModuleReportViewProps = {
  data: ModuleReportData;
  query: {
    preset: string;
    dateFrom: string;
    dateTo: string;
    orderType: string;
    orderStatus: string;
    paymentMethod: string;
    q: string;
    page: number;
    pageSize: number;
  };
  errorMessage?: string | null;
};

export function ModuleReportView({
  data,
  query,
  errorMessage,
}: ModuleReportViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParams = useCallback(
    (patch: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "") params.delete(key);
        else params.set(key, String(value));
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <PageContainer title={data.title} description={data.description}>
      <div className="space-y-6">
        <ReportFiltersBar kind={data.kind} query={query} />

        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.kpis.map((kpi) => (
            <StatCard
              key={kpi.id}
              title={kpi.title}
              value={kpi.value}
              description={kpi.description}
              accent={kpi.accent}
              trend={kpi.trend}
            />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {data.charts.map((chart) => (
            <AppCard key={chart.id} title={chart.title}>
              {chart.id.includes("heatmap") ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Heatmap placeholder — spatial analytics reserved.
                  </p>
                  <ReportChart type={chart.type} points={chart.points} />
                </div>
              ) : (
                <ReportChart type={chart.type} points={chart.points} />
              )}
            </AppCard>
          ))}
        </div>

        {data.summary.length > 0 ? (
          <AppCard title="Summary" description="Grouped totals">
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.summary.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-border/70 px-3 py-2 text-sm"
                >
                  <p className="text-muted-foreground">{item.label}</p>
                  <p className="font-semibold tabular-nums">{item.value}</p>
                  {item.meta ? (
                    <p className="text-xs text-muted-foreground">{item.meta}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </AppCard>
        ) : null}

        <AppCard
          title="Detail table"
          description="Paginated report rows · drill-down placeholder"
        >
          {data.table.rows.length === 0 ? (
            <TableEmptyState
              title="No rows"
              description="Adjust filters or date range to see results."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    {data.table.columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={
                          column.align === "right" ? "text-right" : undefined
                        }
                      >
                        {column.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.table.rows.map((row, index) => (
                    <TableRow key={index}>
                      {data.table.columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={
                            column.align === "right"
                              ? "text-right tabular-nums"
                              : undefined
                          }
                        >
                          {row[column.key] ?? "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {data.table.totals ? (
            <dl className="mt-4 flex flex-wrap gap-4 text-sm">
              {Object.entries(data.table.totals).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs text-muted-foreground">{key}</dt>
                  <dd className="font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {data.table.meta.total} row
              {data.table.meta.total === 1 ? "" : "s"}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <PageSizeSelector
                value={query.pageSize}
                onChange={(value) =>
                  updateParams({ pageSize: value, page: 1 })
                }
              />
              <Pagination
                page={data.table.meta.page}
                totalPages={data.table.meta.totalPages}
                onPageChange={(page) => updateParams({ page })}
              />
            </div>
          </div>
        </AppCard>
      </div>
    </PageContainer>
  );
}
