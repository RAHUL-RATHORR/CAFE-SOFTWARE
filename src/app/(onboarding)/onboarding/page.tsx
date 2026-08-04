import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding";

export const metadata: Metadata = {
  title: "Restaurant Onboarding",
  description: "Set up your restaurant workspace in DineFlow",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
