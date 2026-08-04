import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function VendorsLoading() {
  return (
    <PageContainer title="Vendors" description="Loading vendors…">
      <TableLoadingSkeleton rows={6} columns={7} />
    </PageContainer>
  );
}
