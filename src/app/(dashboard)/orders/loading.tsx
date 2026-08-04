import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function OrdersLoading() {
  return (
    <PageContainer title="Orders" description="Loading orders…">
      <TableLoadingSkeleton rows={6} columns={7} />
    </PageContainer>
  );
}
