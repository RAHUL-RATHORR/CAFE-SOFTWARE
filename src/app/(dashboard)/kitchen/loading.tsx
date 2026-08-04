import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function KitchenLoading() {
  return (
    <PageContainer title="Kitchen" description="Loading kitchen board…">
      <TableLoadingSkeleton rows={4} columns={4} />
    </PageContainer>
  );
}
