import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your DineFlow account password",
};

export default function ForgotPasswordPage() {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Forgot password</CardTitle>
        <CardDescription>
          Enter your email and we will send reset instructions when email
          delivery is connected.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
