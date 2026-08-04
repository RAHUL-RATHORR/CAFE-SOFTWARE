import { TableLoadingSkeleton } from "@/components/tables/table-loading-skeleton";
import { PageContainer } from "@/components/common/page-container";

export default function SettingsLoading() {
  return (
    <PageContainer title="Settings" description="Loading settings…">
      <TableLoadingSkeleton rows={5} columns={3} />
    </PageContainer>
  );
}
