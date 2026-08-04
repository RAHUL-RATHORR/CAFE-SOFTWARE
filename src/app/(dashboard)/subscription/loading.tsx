import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function SubscriptionLoading() {
  return (
    <PageContainer title="Subscription" description="Loading…">
      <TableLoadingSkeleton rows={4} columns={4} />
    </PageContainer>
  );
}
