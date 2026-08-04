"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { ShiftsView } from "@/components/shifts/shifts-view";
import { ShiftCalendarPlaceholder } from "@/components/shifts/shift-calendar-placeholder";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useHasPermission } from "@/hooks/rbac";
import { cn } from "@/lib/utils";
import type { ShiftListResult } from "@/types/shift";
import type { EmployeeSelectOption } from "@/types/staff";

export type ShiftsListQuery = {
  q: string;
  status: string;
  employeeId: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

type ShiftsListViewProps = {
  result: ShiftListResult;
  query: ShiftsListQuery;
  employeeOptions: EmployeeSelectOption[];
  errorMessage?: string | null;
};

export function ShiftsListView({
  result,
  query,
  employeeOptions,
  errorMessage,
}: ShiftsListViewProps) {
  const canCreate = useHasPermission(["shifts.create", "staff.manage"]);

  return (
    <PageContainer
      title="Shifts"
      description="Schedule and assign staff shifts."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/staff"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Staff
          </Link>
          {canCreate.allowed ? (
            <Link
              href="/shifts/new"
              className={cn(buttonVariants(), "rounded-xl")}
            >
              New shift
            </Link>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        <ShiftCalendarPlaceholder />
        <Suspense fallback={<TableLoadingSkeleton rows={6} columns={7} />}>
          <ShiftsView
            result={result}
            query={query}
            employeeOptions={employeeOptions}
            errorMessage={errorMessage}
          />
        </Suspense>
      </div>
    </PageContainer>
  );
}
