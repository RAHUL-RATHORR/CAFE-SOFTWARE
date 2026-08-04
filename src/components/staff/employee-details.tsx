"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Clock } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { DsBadge } from "@/components/badges/ds-badge";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { deleteEmployee } from "@/actions/staff";
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_STATUS_VARIANTS,
  EMPLOYMENT_TYPE_LABELS,
  STAFF_DEPARTMENT_LABELS,
  STAFF_DESIGNATION_LABELS,
  ATTENDANCE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
} from "@/config/staff";
import { formatStaffDate } from "@/lib/staff";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/staff";

type EmployeeDetailsProps = {
  employee: Employee;
};

export function EmployeeDetails({ employee }: EmployeeDetailsProps) {
  const router = useRouter();
  const canEdit = useHasPermission(["staff.edit", "staff.manage"]);
  const canDelete = useHasPermission(["staff.delete", "staff.manage"]);
  const canViewShifts = useHasPermission([
    "shifts.view",
    "staff.view",
    "staff.manage",
  ]);
  const canViewAttendance = useHasPermission([
    "attendance.view",
    "attendance.manage",
    "staff.view",
  ]);

  function handleDelete() {
    openConfirmDialog("delete", {
      title: `Delete “${employee.fullName}”?`,
      description: "This employee will be soft-deleted and marked terminated.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const result = await deleteEmployee({ id: employee.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Employee deleted", employee.fullName);
        router.push("/staff");
        router.refresh();
      },
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4">
      <AppCard
        title={employee.fullName}
        description={`${employee.employeeCode} · ${employee.phone}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DsBadge
              variant={EMPLOYEE_STATUS_VARIANTS[employee.status]}
              size="sm"
            >
              {EMPLOYEE_STATUS_LABELS[employee.status]}
            </DsBadge>
            {canEdit.allowed ? (
              <Link
                href={`/staff/${employee.id}/edit`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-xl"
                )}
              >
                <Pencil className="size-3.5" />
                Edit
              </Link>
            ) : null}
          </div>
        }
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Email" value={employee.email || "—"} />
          <DetailItem label="Phone" value={employee.phone} />
          <DetailItem
            label="Department"
            value={STAFF_DEPARTMENT_LABELS[employee.department]}
          />
          <DetailItem
            label="Designation"
            value={STAFF_DESIGNATION_LABELS[employee.designation]}
          />
          <DetailItem label="Role" value={employee.role} />
          <DetailItem
            label="Employment"
            value={EMPLOYMENT_TYPE_LABELS[employee.employmentType]}
          />
          <DetailItem
            label="Joined"
            value={formatStaffDate(employee.joiningDate)}
          />
          <DetailItem
            label="Salary placeholder"
            value={
              employee.salaryPlaceholder > 0
                ? String(employee.salaryPlaceholder)
                : "—"
            }
          />
          <DetailItem
            label="Emergency contact"
            value={
              employee.emergencyContact.name
                ? `${employee.emergencyContact.name} (${employee.emergencyContact.relation || "—"}) · ${employee.emergencyContact.phone || "—"}`
                : "—"
            }
          />
          <DetailItem label="Address" value={employee.address || "—"} />
          {employee.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Notes</dt>
              <dd className="mt-1 text-sm leading-relaxed">{employee.notes}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-4">
          <Link
            href="/staff"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Back to directory
          </Link>
          {canViewShifts.allowed ? (
            <Link
              href={`/shifts?employeeId=${employee.id}`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-xl"
              )}
            >
              <Clock className="size-4" />
              View shifts
            </Link>
          ) : null}
          <Link
            href="/reports/staff"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Staff report
          </Link>
          {canDelete.allowed ? (
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          ) : null}
        </div>
      </AppCard>

      {canViewAttendance.allowed ? (
        <AppCard
          title="Attendance"
          description="Check-in / check-out foundation — device integrations not enabled"
        >
          <p className="text-sm text-muted-foreground">
            Statuses prepared:{" "}
            {Object.values(ATTENDANCE_STATUS_LABELS).join(", ")}. Records will
            appear here once attendance capture is enabled.
          </p>
          <div className="mt-3 rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
            No attendance records yet
          </div>
        </AppCard>
      ) : null}

      <AppCard
        title="Leave requests"
        description="Leave types, balances, and approval placeholders"
      >
        <p className="text-sm text-muted-foreground">
          Types prepared: {Object.values(LEAVE_TYPE_LABELS).join(", ")}. Holiday
          calendar and approvals are placeholders for a future release.
        </p>
        <div className="mt-3 rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
          No leave requests yet
        </div>
      </AppCard>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium capitalize">{value}</dd>
    </div>
  );
}
