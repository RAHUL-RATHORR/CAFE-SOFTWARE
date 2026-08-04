import { PageContainer } from "@/components/common/page-container";
import { EmptyState } from "@/components/common/empty-state";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <PageContainer title={title} description={description}>
      <EmptyState
        title={`${title} module`}
        description="This section is ready for future feature development. No business logic is wired yet."
      />
    </PageContainer>
  );
}
