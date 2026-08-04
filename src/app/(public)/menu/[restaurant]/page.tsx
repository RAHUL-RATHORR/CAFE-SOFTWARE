import { PublicMenuView } from "@/components/qr-ordering";
import { getPublicMenu } from "@/actions/qr-ordering";
import { EmptyState } from "@/components/common/empty-state";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ restaurant: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PublicMenuPage({
  params,
  searchParams,
}: PageProps) {
  const { restaurant } = await params;
  const query = await searchParams;
  const table = first(query.table);
  const result = await getPublicMenu(decodeURIComponent(restaurant), {
    table,
    q: first(query.q),
    categoryId: first(query.categoryId),
    dietary: first(query.dietary) ?? "all",
  });

  if (!result.success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title="Menu unavailable"
          description={result.error.message}
        />
      </div>
    );
  }

  return (
    <PublicMenuView
      payload={result.data}
      restaurantParam={decodeURIComponent(restaurant)}
      tableParam={table}
      initialQuery={{
        q: first(query.q),
        categoryId: first(query.categoryId),
        dietary: first(query.dietary),
      }}
    />
  );
}
