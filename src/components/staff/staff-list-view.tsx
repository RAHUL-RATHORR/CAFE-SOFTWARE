"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { StaffView } from "@/components/staff/staff-view";
import { StaffDashboardCards } from "@/components/staff/staff-dashboard-cards";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useHasPermission } from "@/hooks/rbac";
import { cn } from "@/lib/utils";
import type {
  EmployeeListResult,
  StaffDashboardSummary,
} from "@/types/staff";

export type StaffListQuery = {
  q: string;
  status: string;
  department: string;
  designation: string;
  role: string;
  joiningFrom: string;
  joiningTo: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

type StaffListViewProps = {
  result: EmployeeListResult;
  summary: StaffDashboardSummary;
  query: StaffListQuery;
  errorMessage?: string | null;
};

export function StaffListView({
  result,
  summary,
  query,
  errorMessage,
}: StaffListViewProps) {
  const canCreate = useHasPermission(["staff.create", "staff.manage"]);

  return (
    <PageContainer
      title="Staff"
      description="Employee directory, shifts, and attendance foundations."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/shifts"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Shifts
          </Link>
          {canCreate.allowed ? (
            <Link
              href="/staff/new"
              className={cn(buttonVariants(), "rounded-xl")}
            >
              New employee
            </Link>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        <StaffDashboardCards summary={summary} />
        <Suspense fallback={<TableLoadingSkeleton rows={6} columns={8} />}>
          <StaffView
            result={result}
            query={query}
            errorMessage={errorMessage}
          />
        </Suspense>
      </div>
    </PageContainer>
  );
}
