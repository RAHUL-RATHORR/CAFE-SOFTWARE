import { Suspense } from "react";
import { AdminUsersView } from "@/components/admin";
import { getAdminUsers } from "@/actions/admin";
import { searchAdminUsersSchema } from "@/lib/validators/admin";
import { AuthError } from "@/components/auth/auth-error";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsed = searchAdminUsersSchema.safeParse({
    q: first(params.q) ?? "",
    status: first(params.status) ?? "all",
    role: first(params.role) ?? "",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "10",
  });
  const query = parsed.success
    ? parsed.data
    : searchAdminUsersSchema.parse({});
  const result = await getAdminUsers(query);

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
    <Suspense fallback={<TableLoadingSkeleton rows={6} columns={6} />}>
      <AdminUsersView
        items={result.success ? result.data.items : []}
        meta={result.success ? result.data.meta : emptyMeta}
        query={{
          q: query.q ?? "",
          status: query.status,
          role: query.role ?? "",
          page: query.page,
          pageSize: query.pageSize,
        }}
        errorMessage={result.success ? null : result.error.message}
      />
    </Suspense>
  );
}
