import { notFound } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { MenuItemForm } from "@/components/menu-items";
import { AuthError } from "@/components/auth/auth-error";
import {
  getMenuItemById,
  getMenuItemCategoryOptions,
} from "@/actions/menu-items";
import { resolveMenuItemActor } from "@/actions/menu-items/context";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMenuItemPage({ params }: PageProps) {
  const actor = await resolveMenuItemActor([
    "menu-items.edit",
    "menu-items.manage",
  ]);
  if (!actor.success) {
    return (
      <AuthError
        code={
          actor.error.code === "UNAUTHORIZED" ? "session_expired" : "forbidden"
        }
      />
    );
  }

  const { id } = await params;
  const [result, categories] = await Promise.all([
    getMenuItemById(id),
    getMenuItemCategoryOptions(),
  ]);

  if (!result.success) {
    if (result.error.code === "NOT_FOUND") notFound();
    return (
      <PageContainer title="Edit menu item">
        <p className="text-sm text-destructive">{result.error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit menu item"
      description={`Update “${result.data.name}”.`}
    >
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <MenuItemForm
          mode="edit"
          item={result.data}
          categoryOptions={categories.success ? categories.data : []}
        />
      </div>
    </PageContainer>
  );
}
