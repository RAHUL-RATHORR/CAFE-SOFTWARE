import type { Metadata } from "next";
import { AdminShell } from "@/components/admin";
import { RestaurantSetupWizard } from "@/features/restaurant-setup";

export const metadata: Metadata = {
  title: "Onboard restaurant",
  description: "Super Admin restaurant onboarding and setup wizard",
};

export default function AdminRestaurantOnboardPage() {
  return (
    <AdminShell
      title="Onboard restaurant"
      description="Create a restaurant, owner placeholders, plan, branch, and tables in a few minutes."
    >
      <RestaurantSetupWizard />
    </AdminShell>
  );
}
