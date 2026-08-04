import { PageContainer } from "@/components/common/page-container";
import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";

export default function ReportsLoading() {
  return (
    <PageContainer title="Reports" description="Loading analytics…">
      <TableLoadingSkeleton rows={6} columns={5} />
    </PageContainer>
  );
}
