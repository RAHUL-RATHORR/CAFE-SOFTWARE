import { z } from "zod";
import {
  REPORT_DATE_PRESETS,
  REPORT_KINDS,
} from "@/types/report";

export const reportDatePresetSchema = z.enum(REPORT_DATE_PRESETS);
export const reportKindSchema = z.enum(REPORT_KINDS);

export const reportFiltersSchema = z.object({
  preset: reportDatePresetSchema.default("month"),
  dateFrom: z.string().trim().optional().or(z.literal("")),
  dateTo: z.string().trim().optional().or(z.literal("")),
  branchId: z.string().trim().optional().or(z.literal("")),
  categoryId: z.string().trim().optional().or(z.literal("")),
  menuItemId: z.string().trim().optional().or(z.literal("")),
  customerId: z.string().trim().optional().or(z.literal("")),
  employeeId: z.string().trim().optional().or(z.literal("")),
  paymentMethod: z.string().trim().optional().or(z.literal("")),
  orderType: z.string().trim().optional().or(z.literal("")),
  orderStatus: z.string().trim().optional().or(z.literal("")),
  q: z.string().trim().max(120).optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().trim().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const reportExportSchema = z.object({
  kind: reportKindSchema,
  format: z.enum(["pdf", "excel", "csv", "print", "email"]),
  filters: reportFiltersSchema.partial().optional(),
});

export const savedReportPlaceholderSchema = z.object({
  name: z.string().trim().min(1).max(120),
  kind: reportKindSchema,
  filters: reportFiltersSchema.partial().optional(),
});

export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;
export type ReportExportInput = z.infer<typeof reportExportSchema>;
export type SavedReportPlaceholderInput = z.infer<
  typeof savedReportPlaceholderSchema
>;
