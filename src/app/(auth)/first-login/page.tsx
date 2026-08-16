import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FirstLoginForm } from "@/components/auth/first-login-form";

export const metadata: Metadata = {
  title: "Change Password",
  description: "Please change your password to continue",
};

export default function FirstLoginPage() {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Change Password</CardTitle>
        <CardDescription>
          For security reasons, you must change your password before you can access your workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FirstLoginForm />
      </CardContent>
    </Card>
  );
}
