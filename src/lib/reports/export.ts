import type {
  ReportExportFormat,
  ReportExportPlaceholder,
  ReportKind,
  SavedReportPlaceholder,
} from "@/types/report";
import { REPORT_EXPORT_FORMATS } from "@/config/reports";

/**
 * Export foundation — architecture only, no external services.
 */
export function getReportExportFoundation(): ReportExportPlaceholder {
  return {
    supported: true,
    formats: [...REPORT_EXPORT_FORMATS],
    scheduledReportsPlaceholder: true,
    emailReportPlaceholder: true,
    message:
      "Export adapters for PDF, Excel, CSV, print, email, and scheduling are prepared. External delivery is not enabled yet.",
  };
}

export function buildExportFilename(
  kind: ReportKind,
  format: ReportExportFormat
): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `dineflow-${kind}-report-${stamp}.${format === "excel" ? "xlsx" : format}`;
}

/** In-memory saved reports placeholder store (per process). */
const savedReportsMemory: SavedReportPlaceholder[] = [];

export function listSavedReportPlaceholders(): SavedReportPlaceholder[] {
  return [...savedReportsMemory];
}

export function saveReportPlaceholder(
  input: Omit<SavedReportPlaceholder, "id" | "createdAt">
): SavedReportPlaceholder {
  const entry: SavedReportPlaceholder = {
    id: `saved-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...input,
  };
  savedReportsMemory.unshift(entry);
  return entry;
}
