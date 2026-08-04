import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function DashboardLoading() {
  return (
    <PageContainer title="Dashboard" description="Loading workspace…">
      <TableLoadingSkeleton rows={4} columns={4} />
    </PageContainer>
  );
}
