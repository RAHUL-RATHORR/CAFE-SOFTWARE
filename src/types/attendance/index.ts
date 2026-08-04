/**
 * Attendance & leave foundations — architecture only.
 */

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "half-day",
  "on-leave",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type AttendanceRecord = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: number;
  lateMinutes: number;
  /** FUTURE PLACEHOLDER */
  overtimeMinutes: number;
  status: AttendanceStatus;
  notes: string;
};

export const LEAVE_TYPES = [
  "casual",
  "sick",
  "earned",
  "unpaid",
  "other",
] as const;

export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type LeaveRequestStatus = (typeof LEAVE_REQUEST_STATUSES)[number];

export type LeaveRequest = {
  id: string;
  restaurantId: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveRequestStatus;
  /** FUTURE PLACEHOLDER */
  approvalNote: string;
  createdAt: string;
};

export type LeaveBalancePlaceholder = {
  employeeId: string;
  leaveType: LeaveType;
  balance: number;
  used: number;
};

/** Holiday calendar placeholder */
export type HolidayPlaceholder = {
  id: string;
  name: string;
  date: string;
};
