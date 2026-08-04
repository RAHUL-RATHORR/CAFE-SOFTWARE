import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function KitchenTicketLoading() {
  return (
    <PageContainer title="Kitchen ticket" description="Loading ticket…">
      <TableLoadingSkeleton rows={6} columns={3} />
    </PageContainer>
  );
}
