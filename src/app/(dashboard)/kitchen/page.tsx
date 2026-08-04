import { Suspense } from "react";
import { PageContainer } from "@/components/common/page-container";
import { KitchenDashboard } from "@/components/kitchen";
import { AuthError } from "@/components/auth/auth-error";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import {
  getKitchenDashboard,
  getKitchenFilterOptions,
} from "@/actions/kitchen";
import { searchKitchenSchema } from "@/lib/validators/kitchen";
import { CHEF_OPTIONS } from "@/config/kitchen";
import { emptyKitchenBoard } from "@/lib/kitchen";
import type { KitchenDashboardData } from "@/types/kitchen";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function KitchenPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const parsed = searchKitchenSchema.safeParse({
    q: first(params.q) ?? "",
    status: first(params.status) ?? "all",
    orderType: first(params.orderType) ?? "all",
    priority: first(params.priority) ?? "all",
    tableId: first(params.tableId) ?? "",
    assignedChefId: first(params.assignedChefId) ?? "",
    view: first(params.view) ?? "board",
  });

  const queryInput = parsed.success
    ? parsed.data
    : searchKitchenSchema.parse({});

  const [result, options] = await Promise.all([
    getKitchenDashboard(queryInput),
    getKitchenFilterOptions(),
  ]);

  if (!result.success && result.error.code === "UNAUTHORIZED") {
    return <AuthError code="session_expired" />;
  }
  if (!result.success && result.error.code === "FORBIDDEN") {
    return <AuthError code="forbidden" />;
  }

  const emptyData: KitchenDashboardData = {
    summary: {
      waiting: 0,
      preparing: 0,
      ready: 0,
      completedToday: 0,
      averagePreparationMinutes: null,
    },
    board: emptyKitchenBoard(),
    tickets: [],
  };

  return (
    <PageContainer
      title="Kitchen"
      description="Monitor preparation queues and ticket status."
    >
      <Suspense fallback={<TableLoadingSkeleton rows={4} columns={4} />}>
        <KitchenDashboard
          data={result.success ? result.data : emptyData}
          filterOptions={
            options.success
              ? options.data
              : { tables: [], chefs: CHEF_OPTIONS }
          }
          query={{
            q: queryInput.q ?? "",
            status: queryInput.status,
            orderType: queryInput.orderType,
            priority: queryInput.priority,
            tableId: queryInput.tableId ?? "",
            assignedChefId: queryInput.assignedChefId ?? "",
            view: queryInput.view,
          }}
          errorMessage={result.success ? null : result.error.message}
        />
      </Suspense>
    </PageContainer>
  );
}
