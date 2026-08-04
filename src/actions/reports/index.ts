"use server";

import { isDatabaseError } from "@/lib/database";
import {
  buildExportFilename,
  getReportExportFoundation,
  listSavedReportPlaceholders,
  reportFailure,
  reportSuccess,
  saveReportPlaceholder,
  zodFieldErrors,
} from "@/lib/reports";
import {
  reportExportSchema,
  reportFiltersSchema,
  reportKindSchema,
  savedReportPlaceholderSchema,
} from "@/lib/validators/report";
import { reportRepository } from "@/repositories/report";
import { resolveReportActor } from "@/actions/reports/context";
import type {
  ExecutiveDashboardData,
  ModuleReportData,
  ReportExportPlaceholder,
  ReportKind,
  SavedReportPlaceholder,
  ReportActionResult,
} from "@/types/report";

function mapDbError(error: unknown): ReportActionResult<never> {
  if (isDatabaseError(error)) {
    return reportFailure("DATABASE_ERROR", error.message);
  }
  return reportFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong loading reports."
  );
}

const VIEW_PERMS = [
  "reports.view",
  "reports.manage",
  "analytics.view",
  "analytics.manage",
] as const;

export async function getExecutiveDashboard(
  input: unknown = {}
): Promise<ReportActionResult<ExecutiveDashboardData>> {
  const actor = await resolveReportActor([...VIEW_PERMS]);
  if (!actor.success) return actor;

  const parsed = reportFiltersSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return reportFailure(
      "VALIDATION_ERROR",
      "Invalid report filters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await reportRepository.getExecutiveDashboard(
      actor.data.restaurantId,
      parsed.data
    );
    return reportSuccess(data);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getModuleReport(
  kindInput: unknown,
  filtersInput: unknown = {}
): Promise<ReportActionResult<ModuleReportData>> {
  const actor = await resolveReportActor([...VIEW_PERMS]);
  if (!actor.success) return actor;

  const kindParsed = reportKindSchema.safeParse(kindInput);
  if (!kindParsed.success || kindParsed.data === "executive") {
    return reportFailure("VALIDATION_ERROR", "Invalid report kind.");
  }

  const parsed = reportFiltersSchema.safeParse(filtersInput ?? {});
  if (!parsed.success) {
    return reportFailure(
      "VALIDATION_ERROR",
      "Invalid report filters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await reportRepository.getModuleReport(
      actor.data.restaurantId,
      kindParsed.data,
      parsed.data
    );
    return reportSuccess(data);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function requestReportExport(
  input: unknown
): Promise<
  ReportActionResult<{
    foundation: ReportExportPlaceholder;
    filename: string;
    kind: ReportKind;
    format: string;
  }>
> {
  const actor = await resolveReportActor([
    "reports.export",
    "reports.manage",
    "analytics.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = reportExportSchema.safeParse(input);
  if (!parsed.success) {
    return reportFailure(
      "VALIDATION_ERROR",
      "Invalid export request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const foundation = getReportExportFoundation();
  return reportSuccess({
    foundation,
    filename: buildExportFilename(parsed.data.kind, parsed.data.format),
    kind: parsed.data.kind,
    format: parsed.data.format,
  });
}

export async function getSavedReports(): Promise<
  ReportActionResult<SavedReportPlaceholder[]>
> {
  const actor = await resolveReportActor([...VIEW_PERMS]);
  if (!actor.success) return actor;
  return reportSuccess(listSavedReportPlaceholders());
}

export async function saveReport(
  input: unknown
): Promise<ReportActionResult<SavedReportPlaceholder>> {
  const actor = await resolveReportActor([
    "reports.manage",
    "analytics.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = savedReportPlaceholderSchema.safeParse(input);
  if (!parsed.success) {
    return reportFailure(
      "VALIDATION_ERROR",
      "Invalid saved report.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const saved = saveReportPlaceholder({
    name: parsed.data.name,
    kind: parsed.data.kind,
    filters: parsed.data.filters ?? {},
  });
  return reportSuccess(saved);
}

export async function getReportExportInfo(): Promise<
  ReportActionResult<ReportExportPlaceholder>
> {
  const actor = await resolveReportActor([
    "reports.view",
    "reports.export",
    "reports.manage",
    "analytics.view",
    "analytics.manage",
  ]);
  if (!actor.success) return actor;
  return reportSuccess(getReportExportFoundation());
}
