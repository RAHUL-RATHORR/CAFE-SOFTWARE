"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { AppCard } from "@/components/cards/app-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { DsBadge } from "@/components/badges/ds-badge";
import { openConfirmDialog } from "@/components/feedback/confirm-presets";
import { assignShift, deleteShift } from "@/actions/shifts";
import {
  SHIFT_STATUS_LABELS,
  SHIFT_STATUS_VARIANTS,
  WEEK_DAY_LABELS,
} from "@/config/staff";
import { formatStaffDate } from "@/lib/staff";
import { useHasPermission } from "@/hooks/rbac";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { Shift } from "@/types/shift";
import type { EmployeeSelectOption } from "@/types/staff";

type ShiftDetailsProps = {
  shift: Shift;
  employeeOptions: EmployeeSelectOption[];
  initialEdit?: boolean;
};

export function ShiftDetails({
  shift,
  employeeOptions,
  initialEdit = false,
}: ShiftDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assignId, setAssignId] = useState(shift.employeeId ?? "");
  const [showAssign, setShowAssign] = useState(initialEdit && !shift.employeeId);

  const canEdit = useHasPermission(["shifts.edit", "staff.manage"]);

  function handleDelete() {
    openConfirmDialog("delete", {
      title: `Delete “${shift.shiftName}”?`,
      description: "This shift will be soft-deleted from the schedule.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        const result = await deleteShift({ id: shift.id });
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Shift deleted", shift.shiftName);
        router.push("/shifts");
        router.refresh();
      },
    });
  }

  function handleAssign() {
    if (!assignId) {
      toast.error("Select an employee to assign.");
      return;
    }
    startTransition(async () => {
      const result = await assignShift({
        id: shift.id,
        employeeId: assignId,
      });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Shift assigned", result.data.employeeName ?? "Employee");
      setShowAssign(false);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <AppCard
        title={shift.shiftName}
        description={`${shift.startTime} – ${shift.endTime} · ${shift.workingHours}h`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DsBadge variant={SHIFT_STATUS_VARIANTS[shift.status]} size="sm">
              {SHIFT_STATUS_LABELS[shift.status]}
            </DsBadge>
            {canEdit.allowed ? (
              <Link
                href={`/shifts/${shift.id}/edit`}
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
          <DetailItem
            label="Employee"
            value={
              shift.employeeId && shift.employeeName ? (
                <Link
                  href={`/staff/${shift.employeeId}`}
                  className="hover:underline"
                >
                  {shift.employeeName}
                </Link>
              ) : (
                "Unassigned"
              )
            }
          />
          <DetailItem
            label="Break"
            value={`${shift.breakDuration} minutes`}
          />
          <DetailItem
            label="Week days"
            value={
              shift.weekDays.length
                ? shift.weekDays.map((d) => WEEK_DAY_LABELS[d]).join(", ")
                : "—"
            }
          />
          <DetailItem
            label="Created"
            value={formatStaffDate(shift.createdAt)}
          />
          {shift.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Notes</dt>
              <dd className="mt-1 text-sm leading-relaxed">{shift.notes}</dd>
            </div>
          ) : null}
        </dl>

        {canEdit.allowed ? (
          <div className="mt-6 space-y-3 border-t border-border/60 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Shift assignment</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setShowAssign((prev) => !prev)}
              >
                <UserPlus className="size-3.5" />
                {showAssign ? "Hide" : "Assign"}
              </Button>
            </div>
            {showAssign ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  aria-label="Assign employee"
                  className="h-9 flex-1 rounded-xl border border-input bg-background px-3 text-sm"
                  value={assignId}
                  onChange={(event) => setAssignId(event.target.value)}
                  disabled={isPending}
                >
                  <option value="">Select employee…</option>
                  {employeeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                      {option.meta ? ` · ${option.meta}` : ""}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  className="rounded-xl"
                  disabled={isPending}
                  onClick={handleAssign}
                >
                  Save assignment
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-4">
          <Link
            href="/shifts"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            Back to shifts
          </Link>
          {canEdit.allowed ? (
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
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
