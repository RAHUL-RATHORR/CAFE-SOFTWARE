import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy path — keep for bookmarks; Super Admin lives at /admin */
export default function AdministrationRedirectPage() {
  redirect("/admin/dashboard");
}
