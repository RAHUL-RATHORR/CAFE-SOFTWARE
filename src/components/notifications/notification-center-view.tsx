"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import {
  Archive,
  Bell,
  CheckCheck,
  History,
  Settings2,
  Trash2,
} from "lucide-react";
import { PageContainer } from "@/components/common/page-container";
import { StatCard } from "@/components/cards/stat-card";
import { AppCard } from "@/components/cards/app-card";
import { DsBadge } from "@/components/badges/ds-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  archiveNotificationPlaceholder,
  deleteNotificationPlaceholder,
  markNotificationsRead,
} from "@/actions/notification";
import {
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_PRIORITY_LABELS,
  NOTIFICATION_PRIORITY_VARIANTS,
  NOTIFICATION_STATUS_LABELS,
  NOTIFICATION_STATUS_VARIANTS,
  NOTIFICATION_TYPE_LABELS,
} from "@/config/notification";
import {
  formatNotificationDateTime,
  formatRelativeTime,
} from "@/lib/notification/formatters";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast-store";
import type {
  Notification,
  NotificationCenterSummary,
  NotificationListResult,
} from "@/types/notification";

export type NotificationListQuery = {
  q: string;
  type: string;
  category: string;
  priority: string;
  status: string;
  page: number;
  pageSize: number;
};

type NotificationCenterViewProps = {
  result: NotificationListResult;
  summary: NotificationCenterSummary;
  query: NotificationListQuery;
  errorMessage?: string | null;
  mode?: "inbox" | "history";
};

function groupByCategory(items: Notification[]) {
  const groups = new Map<string, Notification[]>();
  for (const item of items) {
    const key = item.category;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  return [...groups.entries()];
}

export function NotificationCenterView({
  result,
  summary,
  query,
  errorMessage,
  mode = "inbox",
}: NotificationCenterViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const groups = useMemo(() => groupByCategory(result.items), [result.items]);

  function pushFilters(next: Partial<NotificationListQuery>) {
    const params = new URLSearchParams();
    const merged = { ...query, ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.type && merged.type !== "all") params.set("type", merged.type);
    if (merged.category && merged.category !== "all") {
      params.set("category", merged.category);
    }
    if (merged.priority && merged.priority !== "all") {
      params.set("priority", merged.priority);
    }
    if (merged.status && merged.status !== "all") {
      params.set("status", merged.status);
    }
    if (merged.page > 1) params.set("page", String(merged.page));
    const base =
      mode === "history" ? "/notifications/history" : "/notifications";
    const qs = params.toString();
    router.push(qs ? `${base}?${qs}` : base);
  }

  function markAll() {
    startTransition(async () => {
      const res = await markNotificationsRead({ markAll: true });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success("All caught up", `${res.data.modified} marked read`);
      router.refresh();
    });
  }

  function markOne(id: string) {
    startTransition(async () => {
      const res = await markNotificationsRead({ ids: [id] });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      router.refresh();
    });
  }

  function archiveOne(id: string) {
    startTransition(async () => {
      const res = await archiveNotificationPlaceholder(id);
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success("Archived", "Notification archived (placeholder)");
      router.refresh();
    });
  }

  function deleteOne(id: string) {
    startTransition(async () => {
      const res = await deleteNotificationPlaceholder(id);
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success("Removed", "Soft-archived (delete placeholder)");
      router.refresh();
    });
  }

  return (
    <PageContainer
      title={mode === "history" ? "Notification history" : "Notifications"}
      description={
        mode === "history"
          ? "Past and archived in-app notifications."
          : "Enterprise notification center — in-app alerts across DineFlow modules."
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/notifications/preferences"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-xl gap-1.5"
            )}
          >
            <Settings2 className="size-3.5" aria-hidden />
            Preferences
          </Link>
          {mode === "inbox" ? (
            <Link
              href="/notifications/history"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-xl gap-1.5"
              )}
            >
              <History className="size-3.5" aria-hidden />
              History
            </Link>
          ) : (
            <Link
              href="/notifications"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-xl gap-1.5"
              )}
            >
              <Bell className="size-3.5" aria-hidden />
              Inbox
            </Link>
          )}
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl gap-1.5"
            disabled={isPending || summary.unreadCount === 0}
            onClick={markAll}
          >
            <CheckCheck className="size-3.5" aria-hidden />
            Mark all read
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Unread"
            value={String(summary.unreadCount)}
            accent="warning"
            icon={<Bell className="size-4" />}
          />
          <StatCard
            title="Total"
            value={String(summary.totalCount)}
            accent="primary"
          />
          <StatCard
            title="Critical unread"
            value={String(summary.criticalCount)}
            accent="danger"
          />
          <StatCard
            title="Today"
            value={String(summary.todayCount)}
            accent="success"
          />
        </div>

        <AppCard
          title="Filters"
          description="Search by type, priority, status, and category"
          contentClassName="space-y-3"
        >
          <form
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              pushFilters({
                q: String(form.get("q") ?? ""),
                type: String(form.get("type") ?? "all"),
                category: String(form.get("category") ?? "all"),
                priority: String(form.get("priority") ?? "all"),
                status: String(form.get("status") ?? "all"),
                page: 1,
              });
            }}
          >
            <Input
              name="q"
              defaultValue={query.q}
              placeholder="Search notifications…"
              className="rounded-xl md:col-span-2 xl:col-span-1"
            />
            <select
              name="type"
              defaultValue={query.type}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="all">All types</option>
              {Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              name="category"
              defaultValue={query.category}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="all">All categories</option>
              {Object.entries(NOTIFICATION_CATEGORY_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
            <select
              name="priority"
              defaultValue={query.priority}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="all">All priorities</option>
              {Object.entries(NOTIFICATION_PRIORITY_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
            <select
              name="status"
              defaultValue={query.status}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              {Object.entries(NOTIFICATION_STATUS_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
            <div className="md:col-span-2 xl:col-span-5">
              <Button type="submit" className="rounded-xl">
                Apply filters
              </Button>
            </div>
          </form>
        </AppCard>

        {result.items.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="You're all caught up. New events from Orders, Kitchen, Billing, and more will appear here."
          />
        ) : (
          <div className="space-y-6">
            {groups.map(([category, items]) => (
              <AppCard
                key={category}
                title={
                  NOTIFICATION_CATEGORY_LABELS[
                    category as keyof typeof NOTIFICATION_CATEGORY_LABELS
                  ] ?? category
                }
                description={`${items.length} notification${items.length === 1 ? "" : "s"}`}
                contentClassName="space-y-2"
              >
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-start sm:justify-between",
                      item.status === "unread" &&
                        "border-primary/25 bg-accent/20"
                    )}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        if (item.status === "unread") markOne(item.id);
                        if (item.actionUrl) router.push(item.actionUrl);
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.title}</p>
                        <DsBadge
                          variant={NOTIFICATION_PRIORITY_VARIANTS[item.priority]}
                          size="sm"
                        >
                          {NOTIFICATION_PRIORITY_LABELS[item.priority]}
                        </DsBadge>
                        <DsBadge
                          variant={NOTIFICATION_STATUS_VARIANTS[item.status]}
                          size="sm"
                        >
                          {NOTIFICATION_STATUS_LABELS[item.status]}
                        </DsBadge>
                        <DsBadge variant="secondary" size="sm">
                          {NOTIFICATION_TYPE_LABELS[item.type]}
                        </DsBadge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelativeTime(item.createdAt)} ·{" "}
                        {formatNotificationDateTime(item.createdAt)}
                      </p>
                    </button>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="rounded-lg"
                        aria-label="Archive"
                        disabled={isPending}
                        onClick={() => archiveOne(item.id)}
                      >
                        <Archive className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="rounded-lg"
                        aria-label="Delete"
                        disabled={isPending}
                        onClick={() => deleteOne(item.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </AppCard>
            ))}
          </div>
        )}

        {result.meta.totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Page {result.meta.page} of {result.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={!result.meta.hasPreviousPage}
                onClick={() => pushFilters({ page: query.page - 1 })}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={!result.meta.hasNextPage}
                onClick={() => pushFilters({ page: query.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
