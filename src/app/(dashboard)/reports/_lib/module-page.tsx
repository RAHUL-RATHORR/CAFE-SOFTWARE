import { ModuleReportView } from "@/components/reports";
import { AuthError } from "@/components/auth/auth-error";
import { getModuleReport } from "@/actions/reports";
import {
  parseReportSearchParams,
  toReportQuery,
} from "@/app/(dashboard)/reports/_lib/parse-filters";
import type { ReportKind } from "@/types/report";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function ModuleReportPage({
  kind,
  searchParams,
}: {
  kind: Exclude<ReportKind, "executive">;
  searchParams: PageProps["searchParams"];
}) {
  const params = await searchParams;
  const filters = parseReportSearchParams(params);
  const result = await getModuleReport(kind, filters);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  if (!result.success) {
    return (
      <ModuleReportView
        data={{
          kind,
          title: "Report",
          description: result.error.message,
          kpis: [],
          charts: [],
          table: {
            columns: [],
            rows: [],
            meta: {
              page: 1,
              pageSize: 10,
              total: 0,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
          summary: [],
        }}
        query={toReportQuery(filters)}
        errorMessage={result.error.message}
      />
    );
  }

  return (
    <ModuleReportView data={result.data} query={toReportQuery(filters)} />
  );
}
