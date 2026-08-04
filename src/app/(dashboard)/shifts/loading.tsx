import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function ShiftsLoading() {
  return (
    <PageContainer title="Shifts" description="Loading shifts…">
      <TableLoadingSkeleton rows={6} columns={7} />
    </PageContainer>
  );
}
