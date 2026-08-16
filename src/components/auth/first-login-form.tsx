"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthError } from "@/components/auth/auth-error";
import { AuthPasswordInput } from "@/components/auth/auth-password-input";
import {
  resetPasswordSchema,
  type ResetPasswordSchema,
} from "@/lib/validations/auth";

export function FirstLoginForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setErrorCode(null);

    try {
      // Placeholder: wire to API endpoint to change password and set mustChangePassword = false
      await new Promise((resolve) => setTimeout(resolve, 600));
      // After success, navigate to dashboard and refresh to update session
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorCode("network_error");
      setSubmitting(false);
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <AuthError code={errorCode} />

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <AuthPasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="Create a new password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <AuthPasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="Confirm your password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Updating…
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  );
}
