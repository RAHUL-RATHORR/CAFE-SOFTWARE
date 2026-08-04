import { AdminReportsView } from "@/components/admin";
import { getAdminReport } from "@/actions/admin";
import { AuthError } from "@/components/auth/auth-error";
import { adminReportKindSchema } from "@/lib/validators/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const kindRaw = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const kind = adminReportKindSchema.safeParse(kindRaw ?? "revenue").success
    ? adminReportKindSchema.parse(kindRaw ?? "revenue")
    : "revenue";

  const result = await getAdminReport(kind);
  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const fallback = {
    kind: "revenue" as const,
    title: "Revenue Report",
    description: "",
    kpis: [],
    series: [],
  };

  return (
    <AdminReportsView
      initialReport={result.success ? result.data : fallback}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
