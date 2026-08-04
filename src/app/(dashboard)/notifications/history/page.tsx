import { NotificationCenterView } from "@/components/notifications/notification-center-view";
import {
  getNotificationHistory,
  getNotificationSummary,
} from "@/actions/notification";
import { searchNotificationSchema } from "@/lib/validators/notification";
import { AuthError } from "@/components/auth/auth-error";
import type {
  NotificationCenterSummary,
  NotificationListResult,
} from "@/types/notification";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

const emptySummary: NotificationCenterSummary = {
  unreadCount: 0,
  totalCount: 0,
  criticalCount: 0,
  todayCount: 0,
};

export default async function NotificationHistoryPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const parsed = searchNotificationSchema.safeParse({
    q: first(params.q) ?? "",
    type: first(params.type) ?? "all",
    category: first(params.category) ?? "all",
    priority: first(params.priority) ?? "all",
    status: first(params.status) ?? "all",
    historyOnly: true,
    page: first(params.page) ?? "1",
    pageSize: first(params.pageSize) ?? "20",
  });
  const queryInput = parsed.success
    ? parsed.data
    : searchNotificationSchema.parse({ historyOnly: true });

  const [result, summary] = await Promise.all([
    getNotificationHistory(queryInput),
    getNotificationSummary(),
  ]);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyResult: NotificationListResult = {
    items: [],
    unreadCount: 0,
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
    <NotificationCenterView
      mode="history"
      result={result.success ? result.data : emptyResult}
      summary={summary.success ? summary.data : emptySummary}
      query={{
        q: queryInput.q ?? "",
        type: queryInput.type,
        category: queryInput.category,
        priority: queryInput.priority,
        status: queryInput.status,
        page: queryInput.page,
        pageSize: queryInput.pageSize,
      }}
      errorMessage={result.success ? null : result.error.message}
    />
  );
}
