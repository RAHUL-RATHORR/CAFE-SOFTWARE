import { PageContainer } from "@/components/common/page-container";
import { MenuItemForm } from "@/components/menu-items";
import { AuthError } from "@/components/auth/auth-error";
import { getMenuItemCategoryOptions } from "@/actions/menu-items";
import { resolveMenuItemActor } from "@/actions/menu-items/context";

export const dynamic = "force-dynamic";

export default async function NewMenuItemPage() {
  const actor = await resolveMenuItemActor([
    "menu-items.create",
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

  const categories = await getMenuItemCategoryOptions();

  return (
    <PageContainer
      title="New menu item"
      description="Create a dish with pricing and availability."
    >
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <MenuItemForm
          mode="create"
          categoryOptions={categories.success ? categories.data : []}
        />
      </div>
    </PageContainer>
  );
}
