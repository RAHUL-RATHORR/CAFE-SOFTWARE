import { Suspense } from "react";
import { AdminAuditView } from "@/components/admin";
import { getAdminAuditLogs } from "@/actions/admin";
import { searchAuditSchema } from "@/lib/validators/admin";
import { AuthError } from "@/components/auth/auth-error";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminAuditPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsed = searchAuditSchema.safeParse({
    q: first(params.q) ?? "",
    category: first(params.category) ?? "all",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "20",
  });
  const query = parsed.success ? parsed.data : searchAuditSchema.parse({});
  const result = await getAdminAuditLogs(query);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyMeta = {
    page: query.page,
    pageSize: query.pageSize,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  return (
    <Suspense fallback={<TableLoadingSkeleton rows={6} columns={5} />}>
      <AdminAuditView
        items={result.success ? result.data.items : []}
        meta={result.success ? result.data.meta : emptyMeta}
        query={{
          q: query.q ?? "",
          category: query.category,
          page: query.page,
          pageSize: query.pageSize,
        }}
        errorMessage={result.success ? null : result.error.message}
      />
    </Suspense>
  );
}
