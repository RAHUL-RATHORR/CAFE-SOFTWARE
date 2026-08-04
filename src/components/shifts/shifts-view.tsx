"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { TableToolbar } from "@/components/tables/table-toolbar";
import { Pagination } from "@/components/tables/pagination";
import { PageSizeSelector } from "@/components/tables/page-size-selector";
import { SortButton } from "@/components/tables/sort-button";
import { TableEmptyState } from "@/components/tables/table-empty-state";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { FilterDropdown } from "@/components/tables/filter-dropdown";
import { DsBadge } from "@/components/badges/ds-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { deleteShift } from "@/actions/shifts";
import {
  SHIFT_STATUS_LABELS,
  SHIFT_STATUS_VARIANTS,
  WEEK_DAY_LABELS,
} from "@/config/staff";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { ShiftsListQuery } from "@/components/shifts/shifts-list-view";
import type { Shift, ShiftListResult } from "@/types/shift";
import type { EmployeeSelectOption } from "@/types/staff";
import type { SortDirection } from "@/types";

const statusFilterOptions = [
  { label: "All statuses", value: "all" },
  ...Object.entries(SHIFT_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

type ShiftsViewProps = {
  result: ShiftListResult;
  query: ShiftsListQuery;
  employeeOptions: EmployeeSelectOption[];
  errorMessage?: string | null;
};

export function ShiftsView({
  result,
  query,
  employeeOptions,
  errorMessage,
}: ShiftsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query.q);

  const canCreate = useHasPermission(["shifts.create", "staff.manage"]);
  const canEdit = useHasPermission(["shifts.edit", "staff.manage"]);

  const employeeFilterOptions = [
    { label: "All employees", value: "all" },
    ...employeeOptions.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  ];

  const updateParams = useCallback(
    (patch: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      if (!("page" in patch)) params.set("page", "1");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    setSearchValue(query.q);
  }, [query.q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchValue === query.q) return;
      updateParams({ q: searchValue });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchValue, query.q, updateParams]);

  function sortDirectionFor(field: string): SortDirection {
    if (query.sortBy !== field) return null;
    return query.sortOrder;
  }

  function toggleSort(field: string) {
    const nextOrder =
      query.sortBy === field && query.sortOrder === "asc" ? "desc" : "asc";
    updateParams({ sortBy: field, sortOrder: nextOrder, page: 1 });
  }

  function handleDelete(shift: Shift) {
    openConfirmDialog("delete", {
      title: `Delete “${shift.shiftName}”?`,
      description: "This shift will be soft-deleted from the schedule.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const deleteResult = await deleteShift({ id: shift.id });
        if (!deleteResult.success) {
          toast.error(deleteResult.error.message);
          return;
        }
        toast.success("Shift deleted", shift.shiftName);
        router.refresh();
      },
    });
  }

  return (
    <AppCard
      title="Shift schedule"
      description="Assign and manage working shifts"
      className="shadow-sm"
      contentClassName="space-y-4"
    >
      <TableToolbar
        searchPlaceholder="Search shift name…"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusOptions={statusFilterOptions}
        statusValue={query.status}
        onStatusChange={(value) => updateParams({ status: value })}
        onRefresh={() => router.refresh()}
        trailing={
          canCreate.allowed ? (
            <Link
              href="/shifts/new"
              className={cn(buttonVariants(), "rounded-xl")}
            >
              New shift
            </Link>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Employee"
          options={employeeFilterOptions}
          value={query.employeeId || "all"}
          onChange={(value) =>
            updateParams({ employeeId: value === "all" ? undefined : value })
          }
        />
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {isPending ? <TableLoadingSkeleton rows={5} columns={7} /> : null}

      {!isPending && result.items.length === 0 ? (
        <TableEmptyState
          title="No shifts found"
          description="Create a shift template or assign staff to a schedule."
          actionLabel={canCreate.allowed ? "Create shift" : undefined}
          onAction={
            canCreate.allowed ? () => router.push("/shifts/new") : undefined
          }
        />
      ) : null}

      {!isPending && result.items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton
                    label="Shift"
                    direction={sortDirectionFor("shiftName")}
                    onToggle={() => toggleSort("shiftName")}
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>
                  <SortButton
                    label="Start"
                    direction={sortDirectionFor("startTime")}
                    onToggle={() => toggleSort("startTime")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="End"
                    direction={sortDirectionFor("endTime")}
                    onToggle={() => toggleSort("endTime")}
                  />
                </TableHead>
                <TableHead>Days</TableHead>
                <TableHead>
                  <SortButton
                    label="Status"
                    direction={sortDirectionFor("status")}
                    onToggle={() => toggleSort("status")}
                  />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell>
                    <Link
                      href={`/shifts/${shift.id}`}
                      className="font-medium hover:underline"
                    >
                      {shift.shiftName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {shift.workingHours}h · break {shift.breakDuration}m
                    </p>
                  </TableCell>
                  <TableCell>
                    {shift.employeeId && shift.employeeName ? (
                      <Link
                        href={`/staff/${shift.employeeId}`}
                        className="hover:underline"
                      >
                        {shift.employeeName}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {shift.startTime}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {shift.endTime}
                  </TableCell>
                  <TableCell className="max-w-[140px] text-xs text-muted-foreground">
                    {shift.weekDays.length
                      ? shift.weekDays
                          .map((day) => WEEK_DAY_LABELS[day])
                          .join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <DsBadge
                      variant={SHIFT_STATUS_VARIANTS[shift.status]}
                      size="sm"
                    >
                      {SHIFT_STATUS_LABELS[shift.status]}
                    </DsBadge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-xl"
                        aria-label={`View ${shift.shiftName}`}
                        onClick={() => router.push(`/shifts/${shift.id}`)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {canEdit.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-xl"
                          aria-label={`Edit ${shift.shiftName}`}
                          onClick={() =>
                            router.push(`/shifts/${shift.id}/edit`)
                          }
                        >
                          <Pencil className="size-4" />
                        </Button>
                      ) : null}
                      {canEdit.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-xl text-destructive hover:text-destructive"
                          aria-label={`Delete ${shift.shiftName}`}
                          onClick={() => handleDelete(shift)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {result.meta.total} shift{result.meta.total === 1 ? "" : "s"}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <PageSizeSelector
            value={query.pageSize}
            onChange={(value) => updateParams({ pageSize: value, page: 1 })}
          />
          <Pagination
            page={result.meta.page}
            totalPages={result.meta.totalPages}
            onPageChange={(page) => updateParams({ page })}
          />
        </div>
      </div>
    </AppCard>
  );
}
