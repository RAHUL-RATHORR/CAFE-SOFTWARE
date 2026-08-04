/**
 * Staff / Employee domain types.
 */

import type { AppRole } from "@/types/navigation";

export const EMPLOYEE_STATUSES = [
  "active",
  "inactive",
  "on-leave",
  "terminated",
] as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "intern",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const STAFF_DEPARTMENTS = [
  "kitchen",
  "service",
  "cashier",
  "management",
  "cleaning",
  "delivery",
  "other",
] as const;

export type StaffDepartment = (typeof STAFF_DEPARTMENTS)[number];

export const STAFF_DESIGNATIONS = [
  "head-chef",
  "sous-chef",
  "line-cook",
  "waiter",
  "host",
  "cashier",
  "manager",
  "supervisor",
  "cleaner",
  "other",
] as const;

export type StaffDesignation = (typeof STAFF_DESIGNATIONS)[number];

export type EmployeeEmergencyContact = {
  name: string;
  phone: string;
  relation: string;
};

export type Employee = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  userId: string | null;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  role: AppRole;
  department: StaffDepartment;
  designation: StaffDesignation;
  employmentType: EmploymentType;
  joiningDate: string | null;
  /** FUTURE PLACEHOLDER — payroll */
  salaryPlaceholder: number;
  status: EmployeeStatus;
  emergencyContact: EmployeeEmergencyContact;
  address: string;
  notes: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeListResult = {
  items: Employee[];
  meta: import("@/types/database").PaginationMeta;
};

export type EmployeeSortField =
  | "fullName"
  | "employeeCode"
  | "email"
  | "department"
  | "designation"
  | "role"
  | "status"
  | "joiningDate"
  | "createdAt";

export type EmployeeSelectOption = {
  value: string;
  label: string;
  meta?: string;
};

export type StaffDashboardSummary = {
  totalEmployees: number;
  employeesPresent: number;
  employeesAbsent: number;
  activeShifts: number;
  upcomingShifts: number;
  pendingLeaveRequests: number;
};

export type StaffActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_EMPLOYEE"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

export type StaffActionError = {
  code: StaffActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type StaffActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: StaffActionError };
