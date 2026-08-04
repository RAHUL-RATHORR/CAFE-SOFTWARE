"use client";

import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarClock,
  FileWarning,
} from "lucide-react";
import { StatCard } from "@/components/cards/stat-card";
import type { StaffDashboardSummary } from "@/types/staff";

type StaffDashboardCardsProps = {
  summary: StaffDashboardSummary;
};

export function StaffDashboardCards({ summary }: StaffDashboardCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        title="Total employees"
        value={String(summary.totalEmployees)}
        accent="primary"
        icon={<Users className="size-4" />}
      />
      <StatCard
        title="Present today"
        value={String(summary.employeesPresent)}
        accent="success"
        icon={<UserCheck className="size-4" />}
        description="Attendance foundation"
      />
      <StatCard
        title="Absent today"
        value={String(summary.employeesAbsent)}
        accent="danger"
        icon={<UserX className="size-4" />}
      />
      <StatCard
        title="Active shifts"
        value={String(summary.activeShifts)}
        accent="warning"
        icon={<Clock className="size-4" />}
      />
      <StatCard
        title="Upcoming shifts"
        value={String(summary.upcomingShifts)}
        accent="warning"
        icon={<CalendarClock className="size-4" />}
      />
      <StatCard
        title="Pending leave"
        value={String(summary.pendingLeaveRequests)}
        accent="primary"
        icon={<FileWarning className="size-4" />}
        description="Leave foundation"
      />
    </div>
  );
}
