import { z } from "zod";
import { SHIFT_STATUSES, WEEK_DAYS } from "@/types/shift";
import {
  ATTENDANCE_STATUSES,
  LEAVE_TYPES,
  LEAVE_REQUEST_STATUSES,
} from "@/types/attendance";

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

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM format");

export const shiftStatusSchema = z.enum(SHIFT_STATUSES);
export const weekDaySchema = z.enum(WEEK_DAYS);

function computeWorkingHours(
  startTime: string,
  endTime: string,
  breakDuration: number
): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  minutes = Math.max(0, minutes - (breakDuration || 0));
  return Math.round((minutes / 60) * 100) / 100;
}

const shiftFieldsSchema = z
  .object({
    branchId: optionalObjectId,
    employeeId: optionalObjectId,
    shiftName: z.string().trim().min(1, "Shift name is required").max(120),
    startTime: timeSchema,
    endTime: timeSchema,
    breakDuration: z.coerce.number().int().min(0).max(480).default(30),
    workingHours: z.coerce.number().min(0).max(24).optional(),
    weekDays: z.array(weekDaySchema).default([]),
    status: shiftStatusSchema.default("scheduled"),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .transform((values) => ({
    ...values,
    workingHours:
      values.workingHours ??
      computeWorkingHours(
        values.startTime,
        values.endTime,
        values.breakDuration
      ),
  }));

export const createShiftSchema = shiftFieldsSchema;
export const updateShiftSchema = z
  .object({
    id: z.string().trim().min(1, "Shift id is required"),
    branchId: optionalObjectId,
    employeeId: optionalObjectId,
    shiftName: z.string().trim().min(1).max(120).optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    breakDuration: z.coerce.number().int().min(0).max(480).optional(),
    workingHours: z.coerce.number().min(0).max(24).optional(),
    weekDays: z.array(weekDaySchema).optional(),
    status: shiftStatusSchema.optional(),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .transform((values) => {
    if (values.startTime && values.endTime) {
      return {
        ...values,
        workingHours:
          values.workingHours ??
          computeWorkingHours(
            values.startTime,
            values.endTime,
            values.breakDuration ?? 30
          ),
      };
    }
    return values;
  });

export const deleteShiftSchema = z.object({
  id: z.string().trim().min(1, "Shift id is required"),
});

export const assignShiftSchema = z.object({
  id: z.string().trim().min(1, "Shift id is required"),
  employeeId: z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Select an employee"),
});

export const searchShiftSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(["all", ...SHIFT_STATUSES]).default("all"),
  employeeId: z.string().trim().optional().or(z.literal("")),
  branchId: z.string().trim().optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum(["shiftName", "startTime", "endTime", "status", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const attendanceStatusSchema = z.enum(ATTENDANCE_STATUSES);
export const leaveTypeSchema = z.enum(LEAVE_TYPES);
export const leaveRequestStatusSchema = z.enum(LEAVE_REQUEST_STATUSES);

export const attendanceFoundationSchema = z.object({
  employeeId: z.string().trim().min(1),
  date: z.string().trim().min(1),
  checkIn: z.string().trim().optional().or(z.literal("")),
  checkOut: z.string().trim().optional().or(z.literal("")),
  status: attendanceStatusSchema.default("present"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const leaveRequestFoundationSchema = z.object({
  employeeId: z.string().trim().min(1),
  leaveType: leaveTypeSchema.default("casual"),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
export type DeleteShiftInput = z.infer<typeof deleteShiftSchema>;
export type AssignShiftInput = z.infer<typeof assignShiftSchema>;
export type SearchShiftInput = z.infer<typeof searchShiftSchema>;
export type AttendanceFoundationInput = z.infer<
  typeof attendanceFoundationSchema
>;
export type LeaveRequestFoundationInput = z.infer<
  typeof leaveRequestFoundationSchema
>;
