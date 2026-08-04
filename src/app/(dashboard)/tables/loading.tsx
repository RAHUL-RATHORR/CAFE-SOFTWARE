import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function TablesLoading() {
  return (
    <PageContainer title="Tables" description="Loading tables…">
      <TableLoadingSkeleton rows={6} columns={7} />
    </PageContainer>
  );
}
