"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthError } from "@/components/auth/auth-error";
import { AuthPasswordInput } from "@/components/auth/auth-password-input";
import { AUTH_ROUTES } from "@/lib/auth/constants";
import {
  resetPasswordSchema,
  type ResetPasswordSchema,
} from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

/**
 * Reset-password UI foundation — token validation not implemented yet.
 */
export function ResetPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
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

  const onSubmit = handleSubmit(async () => {
    setSubmitting(true);
    setErrorCode(null);

    try {
      // Placeholder: verify token + update password later
      await new Promise((resolve) => setTimeout(resolve, 600));
      setDone(true);
    } catch {
      setErrorCode("network_error");
    } finally {
      setSubmitting(false);
    }
  });

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="size-5" aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">Password updated</p>
          <p className="text-sm text-muted-foreground">
            Your password reset placeholder completed. Sign in with your new
            credentials when backend reset is connected.
          </p>
        </div>
        <Link
          href={AUTH_ROUTES.login}
          className={cn(buttonVariants({ variant: "default" }), "w-full")}
        >
          Continue to sign in
        </Link>
      </div>
    );
  }

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
          "Reset password"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href={AUTH_ROUTES.login}
          className="font-medium text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
