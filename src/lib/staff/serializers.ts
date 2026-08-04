import type { EmployeeDocument } from "@/models/staff";
import type {
  Employee,
  EmployeeStatus,
  EmploymentType,
  StaffDepartment,
  StaffDesignation,
} from "@/types/staff";
import type { AppRole } from "@/types/navigation";

function idToString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

function toIsoDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function buildFullName(firstName: string, lastName?: string | null) {
  return [firstName.trim(), (lastName ?? "").trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function buildEmployeeCode(date = new Date()): string {
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `EMP-${y}${m}${d}-${suffix}`;
}

export function serializeEmployee(doc: EmployeeDocument): Employee {
  const emergency = (doc.emergencyContact ?? {}) as {
    name?: string;
    phone?: string;
    relation?: string;
  };

  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId),
    userId: idToString(doc.userId),
    employeeCode: doc.employeeCode,
    firstName: doc.firstName,
    lastName: doc.lastName ?? "",
    fullName: doc.fullName || buildFullName(doc.firstName, doc.lastName),
    email: doc.email ?? "",
    phone: doc.phone,
    avatar: doc.avatar ?? "",
    role: (doc.role ?? "waiter") as AppRole,
    department: (doc.department ?? "service") as StaffDepartment,
    designation: (doc.designation ?? "other") as StaffDesignation,
    employmentType: (doc.employmentType ?? "full-time") as EmploymentType,
    joiningDate: toIsoDate(doc.joiningDate),
    salaryPlaceholder: Number(doc.salaryPlaceholder ?? 0),
    status: (doc.status ?? "active") as EmployeeStatus,
    emergencyContact: {
      name: emergency.name ?? "",
      phone: emergency.phone ?? "",
      relation: emergency.relation ?? "",
    },
    address: doc.address ?? "",
    notes: doc.notes ?? "",
    createdBy: idToString(doc.createdBy),
    updatedBy: idToString(doc.updatedBy),
    createdAt: toIsoDate(doc.createdAt) ?? "",
    updatedAt: toIsoDate(doc.updatedAt) ?? "",
  };
}

export function formatStaffDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    date
  );
}
