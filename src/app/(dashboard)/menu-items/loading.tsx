import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function MenuItemsLoading() {
  return (
    <PageContainer title="Menu Items" description="Loading menu items…">
      <TableLoadingSkeleton rows={6} columns={8} />
    </PageContainer>
  );
}
