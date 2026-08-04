import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function StaffLoading() {
  return (
    <PageContainer title="Staff" description="Loading staff…">
      <TableLoadingSkeleton rows={6} columns={8} />
    </PageContainer>
  );
}
