import type { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/session";
import { OnboardingShell } from "@/components/onboarding";

type OnboardingLayoutProps = {
  children: ReactNode;
};

export default async function OnboardingLayout({
  children,
}: OnboardingLayoutProps) {
  await requireAuth({ callbackUrl: "/onboarding" });

  return <OnboardingShell>{children}</OnboardingShell>;
}
