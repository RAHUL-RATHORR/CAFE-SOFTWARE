import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function CustomersLoading() {
  return (
    <PageContainer title="Customers" description="Loading customers…">
      <TableLoadingSkeleton rows={6} columns={8} />
    </PageContainer>
  );
}
