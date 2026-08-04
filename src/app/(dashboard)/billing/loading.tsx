import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function BillingLoading() {
  return (
    <PageContainer title="Billing" description="Loading bills…">
      <TableLoadingSkeleton rows={6} columns={6} />
    </PageContainer>
  );
}
