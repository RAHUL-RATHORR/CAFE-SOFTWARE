import { z } from "zod";
import {
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  STAFF_DEPARTMENTS,
  STAFF_DESIGNATIONS,
} from "@/types/staff";

const optionalObjectId = z.preprocess(
  (value) => {
    if (value === "" || value === undefined) return null;
    return value;
  },
  z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Invalid id")
    .nullable()
    .optional()
);

const optionalDate = z.preprocess(
  (value) => {
    if (value === "" || value == null) return null;
    return value;
  },
  z.string().trim().nullable().optional()
);

export const employeeStatusSchema = z.enum(EMPLOYEE_STATUSES);
export const employmentTypeSchema = z.enum(EMPLOYMENT_TYPES);
export const staffDepartmentSchema = z.enum(STAFF_DEPARTMENTS);
export const staffDesignationSchema = z.enum(STAFF_DESIGNATIONS);

export const emergencyContactSchema = z.object({
  name: z.string().trim().max(120).default(""),
  phone: z.string().trim().max(32).default(""),
  relation: z.string().trim().max(80).default(""),
});

const employeeFieldsSchema = z.object({
  branchId: optionalObjectId,
  userId: optionalObjectId,
  employeeCode: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9-]*$/, "Use letters, numbers, and hyphens only")
    .optional()
    .or(z.literal("")),
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().max(80).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(160)
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(7, "Phone is required")
    .max(32)
    .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
  avatar: z.string().trim().max(500).optional().or(z.literal("")),
  role: z
    .enum([
      "super-admin",
      "restaurant-owner",
      "manager",
      "cashier",
      "chef",
      "waiter",
      "customer",
    ])
    .default("waiter"),
  department: staffDepartmentSchema.default("service"),
  designation: staffDesignationSchema.default("other"),
  employmentType: employmentTypeSchema.default("full-time"),
  joiningDate: optionalDate,
  salaryPlaceholder: z.coerce.number().min(0).optional().default(0),
  status: employeeStatusSchema.default("active"),
  emergencyContact: emergencyContactSchema.default({
    name: "",
    phone: "",
    relation: "",
  }),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const createEmployeeSchema = employeeFieldsSchema;
export const updateEmployeeSchema = employeeFieldsSchema.partial().extend({
  id: z.string().trim().min(1, "Employee id is required"),
});
export const deleteEmployeeSchema = z.object({
  id: z.string().trim().min(1, "Employee id is required"),
});

export const searchEmployeeSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(["all", ...EMPLOYEE_STATUSES]).default("all"),
  department: z.enum(["all", ...STAFF_DEPARTMENTS]).default("all"),
  designation: z.enum(["all", ...STAFF_DESIGNATIONS]).default("all"),
  role: z.string().trim().optional().or(z.literal("")),
  branchId: z.string().trim().optional().or(z.literal("")),
  joiningFrom: z.string().trim().optional().or(z.literal("")),
  joiningTo: z.string().trim().optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum([
      "fullName",
      "employeeCode",
      "email",
      "department",
      "designation",
      "role",
      "status",
      "joiningDate",
      "createdAt",
    ])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type DeleteEmployeeInput = z.infer<typeof deleteEmployeeSchema>;
export type SearchEmployeeInput = z.infer<typeof searchEmployeeSchema>;
