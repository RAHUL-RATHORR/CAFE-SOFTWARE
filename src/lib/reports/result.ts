import type {
  ReportActionError,
  ReportActionErrorCode,
  ReportActionResult,
  ReportDatePreset,
} from "@/types/report";

export function reportSuccess<T>(data: T): ReportActionResult<T> {
  return { success: true, data };
}

export function reportFailure(
  code: ReportActionErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
): ReportActionResult<never> {
  const error: ReportActionError = { code, message, fieldErrors };
  return { success: false, error };
}

export function zodFieldErrors(
  issues: Array<{ path: PropertyKey[]; message: string }>
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "root";
    fieldErrors[key] = fieldErrors[key] ?? [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

export function formatReportMoney(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatReportNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatReportPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function resolveReportDateRange(input: {
  preset: ReportDatePreset;
  dateFrom?: string;
  dateTo?: string;
}): { from: Date; to: Date; label: string } {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (input.preset === "custom") {
    const from = input.dateFrom
      ? startOfDay(new Date(input.dateFrom))
      : todayStart;
    const to = input.dateTo ? endOfDay(new Date(input.dateTo)) : todayEnd;
    return { from, to, label: "Custom range" };
  }

  if (input.preset === "today") {
    return { from: todayStart, to: todayEnd, label: "Today" };
  }

  if (input.preset === "yesterday") {
    const y = new Date(todayStart);
    y.setDate(y.getDate() - 1);
    return { from: startOfDay(y), to: endOfDay(y), label: "Yesterday" };
  }

  if (input.preset === "week") {
    const from = new Date(todayStart);
    from.setDate(from.getDate() - 6);
    return { from, to: todayEnd, label: "Last 7 days" };
  }

  if (input.preset === "quarter") {
    const from = new Date(todayStart);
    from.setMonth(from.getMonth() - 2, 1);
    return { from: startOfDay(from), to: todayEnd, label: "This quarter" };
  }

  if (input.preset === "year") {
    const from = new Date(todayStart.getFullYear(), 0, 1);
    return { from: startOfDay(from), to: todayEnd, label: "This year" };
  }

  // month default
  const from = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  return { from: startOfDay(from), to: todayEnd, label: "This month" };
}

export function buildTrend(
  current: number,
  previous: number,
  label = "vs prior period"
) {
  if (previous <= 0 && current <= 0) {
    return { value: 0, direction: "neutral" as const, label };
  }
  if (previous <= 0) {
    return { value: 100, direction: "up" as const, label };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change * 10) / 10),
    direction:
      change > 0.5 ? ("up" as const) : change < -0.5 ? ("down" as const) : ("neutral" as const),
    label,
  };
}
