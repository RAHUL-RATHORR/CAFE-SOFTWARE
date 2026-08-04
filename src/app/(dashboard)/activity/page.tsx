import { ActivityFeedView } from "@/components/notifications/activity-feed-view";
import { getActivityFeed } from "@/actions/notification";
import { searchActivitySchema } from "@/lib/validators/notification";
import { AuthError } from "@/components/auth/auth-error";
import type { ActivityListResult } from "@/types/notification";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ActivityPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsed = searchActivitySchema.safeParse({
    q: first(params.q) ?? "",
    category: first(params.category) ?? "all",
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "20",
  });
  const queryInput = parsed.success
    ? parsed.data
    : searchActivitySchema.parse({});

  const result = await getActivityFeed(queryInput);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyResult: ActivityListResult = {
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
    <ActivityFeedView
      result={result.success ? result.data : emptyResult}
      query={{
        q: queryInput.q ?? "",
        category: queryInput.category,
        page: queryInput.page,
      }}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
