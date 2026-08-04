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
import { Input } from "@/components/ui/input";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { deleteEmployee } from "@/actions/staff";
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_STATUS_VARIANTS,
  STAFF_DEPARTMENT_LABELS,
  STAFF_DESIGNATION_LABELS,
  STAFF_ROLE_OPTIONS,
} from "@/config/staff";
import { formatStaffDate } from "@/lib/staff";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { StaffListQuery } from "@/components/staff/staff-list-view";
import type { Employee, EmployeeListResult } from "@/types/staff";
import type { SortDirection } from "@/types";

const statusFilterOptions = [
  { label: "All statuses", value: "all" },
  ...Object.entries(EMPLOYEE_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const departmentFilterOptions = [
  { label: "All departments", value: "all" },
  ...Object.entries(STAFF_DEPARTMENT_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const designationFilterOptions = [
  { label: "All designations", value: "all" },
  ...Object.entries(STAFF_DESIGNATION_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

const roleFilterOptions = [
  { label: "All roles", value: "all" },
  ...STAFF_ROLE_OPTIONS.map((role) => ({
    value: role.value,
    label: role.label,
  })),
];

type StaffViewProps = {
  result: EmployeeListResult;
  query: StaffListQuery;
  errorMessage?: string | null;
};

export function StaffView({ result, query, errorMessage }: StaffViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query.q);

  const canCreate = useHasPermission(["staff.create", "staff.manage"]);
  const canEdit = useHasPermission(["staff.edit", "staff.manage"]);
  const canDelete = useHasPermission(["staff.delete", "staff.manage"]);

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

  function handleDelete(employee: Employee) {
    openConfirmDialog("delete", {
      title: `Delete “${employee.fullName}”?`,
      description: "This employee will be soft-deleted and marked terminated.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const deleteResult = await deleteEmployee({ id: employee.id });
        if (!deleteResult.success) {
          toast.error(deleteResult.error.message);
          return;
        }
        toast.success("Employee deleted", employee.fullName);
        router.refresh();
      },
    });
  }

  return (
    <AppCard
      title="Employee directory"
      description="Search and manage restaurant staff"
      className="shadow-sm"
      contentClassName="space-y-4"
    >
      <TableToolbar
        searchPlaceholder="Search name, phone, email, code…"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusOptions={statusFilterOptions}
        statusValue={query.status}
        onStatusChange={(value) => updateParams({ status: value })}
        onRefresh={() => router.refresh()}
        trailing={
          canCreate.allowed ? (
            <Link
              href="/staff/new"
              className={cn(buttonVariants(), "rounded-xl")}
            >
              New employee
            </Link>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Department"
          options={departmentFilterOptions}
          value={query.department || "all"}
          onChange={(value) =>
            updateParams({ department: value === "all" ? undefined : value })
          }
        />
        <FilterDropdown
          label="Designation"
          options={designationFilterOptions}
          value={query.designation || "all"}
          onChange={(value) =>
            updateParams({ designation: value === "all" ? undefined : value })
          }
        />
        <FilterDropdown
          label="Role"
          options={roleFilterOptions}
          value={query.role || "all"}
          onChange={(value) =>
            updateParams({ role: value === "all" ? undefined : value })
          }
        />
        <Input
          type="date"
          aria-label="Joining from"
          value={query.joiningFrom}
          className="h-9 w-36 rounded-xl"
          onChange={(event) =>
            updateParams({ joiningFrom: event.target.value })
          }
        />
        <Input
          type="date"
          aria-label="Joining to"
          value={query.joiningTo}
          className="h-9 w-36 rounded-xl"
          onChange={(event) => updateParams({ joiningTo: event.target.value })}
        />
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {isPending ? <TableLoadingSkeleton rows={5} columns={8} /> : null}

      {!isPending && result.items.length === 0 ? (
        <TableEmptyState
          title="No employees found"
          description="Add your first team member or adjust filters."
          actionLabel={canCreate.allowed ? "Create employee" : undefined}
          onAction={
            canCreate.allowed ? () => router.push("/staff/new") : undefined
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
                    label="Name"
                    direction={sortDirectionFor("fullName")}
                    onToggle={() => toggleSort("fullName")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Code"
                    direction={sortDirectionFor("employeeCode")}
                    onToggle={() => toggleSort("employeeCode")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Department"
                    direction={sortDirectionFor("department")}
                    onToggle={() => toggleSort("department")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Role"
                    direction={sortDirectionFor("role")}
                    onToggle={() => toggleSort("role")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Status"
                    direction={sortDirectionFor("status")}
                    onToggle={() => toggleSort("status")}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label="Joined"
                    direction={sortDirectionFor("joiningDate")}
                    onToggle={() => toggleSort("joiningDate")}
                  />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Link
                      href={`/staff/${employee.id}`}
                      className="font-medium hover:underline"
                    >
                      {employee.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {employee.phone}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {employee.employeeCode}
                  </TableCell>
                  <TableCell>
                    {STAFF_DEPARTMENT_LABELS[employee.department]}
                  </TableCell>
                  <TableCell className="capitalize">{employee.role}</TableCell>
                  <TableCell>
                    <DsBadge
                      variant={EMPLOYEE_STATUS_VARIANTS[employee.status]}
                      size="sm"
                    >
                      {EMPLOYEE_STATUS_LABELS[employee.status]}
                    </DsBadge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatStaffDate(employee.joiningDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-xl"
                        aria-label={`View ${employee.fullName}`}
                        onClick={() => router.push(`/staff/${employee.id}`)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {canEdit.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-xl"
                          aria-label={`Edit ${employee.fullName}`}
                          onClick={() =>
                            router.push(`/staff/${employee.id}/edit`)
                          }
                        >
                          <Pencil className="size-4" />
                        </Button>
                      ) : null}
                      {canDelete.allowed ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-xl text-destructive hover:text-destructive"
                          aria-label={`Delete ${employee.fullName}`}
                          onClick={() => handleDelete(employee)}
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
          {result.meta.total} employee
          {result.meta.total === 1 ? "" : "s"}
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
