import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function CategoriesLoading() {
  return (
    <PageContainer title="Categories" description="Loading categories…">
      <TableLoadingSkeleton rows={6} columns={6} />
    </PageContainer>
  );
}
