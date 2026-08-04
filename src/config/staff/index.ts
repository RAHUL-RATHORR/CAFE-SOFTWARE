import type {
  EmployeeStatus,
  EmploymentType,
  StaffDepartment,
  StaffDesignation,
} from "@/types/staff";
import type { ShiftStatus, WeekDay } from "@/types/shift";
import type { AttendanceStatus, LeaveType } from "@/types/attendance";
import type { AppRole } from "@/types/navigation";

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  "on-leave": "On leave",
  terminated: "Terminated",
};

export const EMPLOYEE_STATUS_VARIANTS: Record<
  EmployeeStatus,
  "success" | "secondary" | "warning" | "danger"
> = {
  active: "success",
  inactive: "secondary",
  "on-leave": "warning",
  terminated: "danger",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  "full-time": "Full time",
  "part-time": "Part time",
  contract: "Contract",
  intern: "Intern",
};

export const STAFF_DEPARTMENT_LABELS: Record<StaffDepartment, string> = {
  kitchen: "Kitchen",
  service: "Service",
  cashier: "Cashier",
  management: "Management",
  cleaning: "Cleaning",
  delivery: "Delivery",
  other: "Other",
};

export const STAFF_DESIGNATION_LABELS: Record<StaffDesignation, string> = {
  "head-chef": "Head chef",
  "sous-chef": "Sous chef",
  "line-cook": "Line cook",
  waiter: "Waiter",
  host: "Host",
  cashier: "Cashier",
  manager: "Manager",
  supervisor: "Supervisor",
  cleaner: "Cleaner",
  other: "Other",
};

export const STAFF_ROLE_OPTIONS: Array<{ value: AppRole; label: string }> = [
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cashier" },
  { value: "chef", label: "Chef" },
  { value: "waiter", label: "Waiter" },
];

export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const SHIFT_STATUS_VARIANTS: Record<
  ShiftStatus,
  "secondary" | "info" | "warning" | "success" | "danger"
> = {
  draft: "secondary",
  scheduled: "info",
  "in-progress": "warning",
  completed: "success",
  cancelled: "danger",
};

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  "half-day": "Half day",
  "on-leave": "On leave",
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  casual: "Casual",
  sick: "Sick",
  earned: "Earned",
  unpaid: "Unpaid",
  other: "Other",
};
