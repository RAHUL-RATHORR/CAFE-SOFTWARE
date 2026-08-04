import { AnnouncementCenterView } from "@/components/notifications/announcement-center-view";
import { getAnnouncements } from "@/actions/notification";
import { searchAnnouncementSchema } from "@/lib/validators/notification";
import { AuthError } from "@/components/auth/auth-error";
import type { AnnouncementListResult } from "@/types/notification";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function AnnouncementsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsed = searchAnnouncementSchema.safeParse({
    q: first(params.q) ?? "",
    scope: first(params.scope) ?? "all",
    status: first(params.status) ?? "all",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "20",
  });
  const queryInput = parsed.success
    ? parsed.data
    : searchAnnouncementSchema.parse({});

  const result = await getAnnouncements(queryInput);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyResult: AnnouncementListResult = {
    items: [],
    meta: {
      page: queryInput.page,
      pageSize: queryInput.pageSize,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };

  return (
    <AnnouncementCenterView
      result={result.success ? result.data : emptyResult}
      query={{
        q: queryInput.q ?? "",
        scope: queryInput.scope,
        status: queryInput.status,
        page: queryInput.page,
      }}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
