"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Download, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterDropdown } from "@/components/tables/filter-dropdown";
import {
  REPORT_DATE_PRESET_LABELS,
  REPORT_NAV_ITEMS,
} from "@/config/reports";
import { requestReportExport, saveReport } from "@/actions/reports";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { ReportDatePreset, ReportKind } from "@/types/report";

const presetOptions = Object.entries(REPORT_DATE_PRESET_LABELS).map(
  ([value, label]) => ({ value, label })
);

type ReportFiltersBarProps = {
  kind: ReportKind;
  query: {
    preset: string;
    dateFrom: string;
    dateTo: string;
    orderType: string;
    orderStatus: string;
    paymentMethod: string;
    q: string;
  };
};

export function ReportFiltersBar({ kind, query }: ReportFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const canExport = useHasPermission([
    "reports.export",
    "reports.manage",
    "analytics.manage",
  ]);
  const canManage = useHasPermission([
    "reports.manage",
    "analytics.manage",
  ]);

  const updateParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (!value || value === "all") params.delete(key);
        else params.set(key, value);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  async function handleExport(format: "csv" | "pdf" | "excel" | "print") {
    const result = await requestReportExport({
      kind,
      format,
      filters: query,
    });
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.info(
      "Export prepared",
      `${result.data.filename} — ${result.data.foundation.message}`
    );
  }

  async function handleSave() {
    const result = await saveReport({
      name: `${kind} · ${new Date().toLocaleDateString()}`,
      kind,
      filters: query,
    });
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Report saved", "Saved reports placeholder stored.");
  }

  return (
    <div className="space-y-3">
      <nav className="flex flex-wrap gap-1.5">
        {REPORT_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Date preset"
          options={presetOptions}
          value={query.preset || "month"}
          onChange={(value) =>
            updateParams({ preset: value as ReportDatePreset })
          }
        />
        <Input
          type="date"
          aria-label="From date"
          value={query.dateFrom}
          className="h-9 w-36 rounded-xl"
          onChange={(event) =>
            updateParams({
              dateFrom: event.target.value,
              preset: "custom",
            })
          }
        />
        <Input
          type="date"
          aria-label="To date"
          value={query.dateTo}
          className="h-9 w-36 rounded-xl"
          onChange={(event) =>
            updateParams({
              dateTo: event.target.value,
              preset: "custom",
            })
          }
        />
        <Input
          value={query.q}
          placeholder="Search…"
          className="h-9 w-40 rounded-xl"
          onChange={(event) => updateParams({ q: event.target.value })}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={isPending}
          onClick={() => router.refresh()}
        >
          Refresh
        </Button>
        {canExport.allowed ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => handleExport("csv")}
            >
              <Download className="size-3.5" />
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => handleExport("pdf")}
            >
              PDF
            </Button>
          </>
        ) : null}
        {canManage.allowed ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={handleSave}
          >
            <BookmarkPlus className="size-3.5" />
            Save
          </Button>
        ) : null}
      </div>
    </div>
  );
}
