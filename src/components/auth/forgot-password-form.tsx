"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthError } from "@/components/auth/auth-error";
import { AUTH_ROUTES } from "@/lib/auth/constants";
import {
  forgotPasswordSchema,
  type ForgotPasswordSchema,
} from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

/**
 * Forgot-password UI foundation — no email delivery yet.
 */
export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async () => {
    setSubmitting(true);
    setErrorCode(null);

    try {
      // Placeholder: wire to email/token flow later
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSent(true);
    } catch {
      setErrorCode("network_error");
    } finally {
      setSubmitting(false);
    }
  });

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="size-5" aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">Check your email</p>
          <p className="text-sm text-muted-foreground">
            If an account exists for that address, password reset instructions
            will be sent. (Placeholder — email delivery not configured.)
          </p>
        </div>
        <Link
          href={AUTH_ROUTES.login}
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <AuthError code={errorCode} />

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@restaurant.com"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          "Send reset link"
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
