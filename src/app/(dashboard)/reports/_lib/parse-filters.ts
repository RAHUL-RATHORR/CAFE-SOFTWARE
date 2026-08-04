import { reportFiltersSchema } from "@/lib/validators/report";
import type { ReportFiltersInput } from "@/lib/validators/report";

export function firstParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseReportSearchParams(
  params: Record<string, string | string[] | undefined>
): ReportFiltersInput {
  const parsed = reportFiltersSchema.safeParse({
    preset: firstParam(params.preset) ?? "month",
    dateFrom: firstParam(params.dateFrom) ?? "",
    dateTo: firstParam(params.dateTo) ?? "",
    branchId: firstParam(params.branchId) ?? "",
    categoryId: firstParam(params.categoryId) ?? "",
    menuItemId: firstParam(params.menuItemId) ?? "",
    customerId: firstParam(params.customerId) ?? "",
    employeeId: firstParam(params.employeeId) ?? "",
    paymentMethod: firstParam(params.paymentMethod) ?? "",
    orderType: firstParam(params.orderType) ?? "",
    orderStatus: firstParam(params.orderStatus) ?? "",
    q: firstParam(params.q) ?? "",
    page: firstParam(params.page) ?? "1",
    pageSize: firstParam(params.pageSize) ?? "10",
    sortBy: firstParam(params.sortBy) ?? "createdAt",
    sortOrder: firstParam(params.sortOrder) ?? "desc",
  });

  return parsed.success ? parsed.data : reportFiltersSchema.parse({});
}

export function toReportQuery(input: ReportFiltersInput) {
  return {
    preset: input.preset,
    dateFrom: input.dateFrom ?? "",
    dateTo: input.dateTo ?? "",
    orderType: input.orderType ?? "",
    orderStatus: input.orderStatus ?? "",
    paymentMethod: input.paymentMethod ?? "",
    q: input.q ?? "",
    page: input.page,
    pageSize: input.pageSize,
  };
}
