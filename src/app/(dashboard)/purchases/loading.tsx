import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function PurchasesLoading() {
  return (
    <PageContainer title="Purchases" description="Loading purchases…">
      <TableLoadingSkeleton rows={6} columns={8} />
    </PageContainer>
  );
}
