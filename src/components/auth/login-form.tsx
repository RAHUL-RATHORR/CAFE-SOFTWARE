"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthError } from "@/components/auth/auth-error";
import { AuthPasswordInput } from "@/components/auth/auth-password-input";
import { useAuth } from "@/hooks/auth";
import {
  AUTH_ROUTES,
  DEFAULT_AUTHENTICATED_REDIRECT,
} from "@/lib/auth/constants";
import { getSafeCallbackUrl } from "@/lib/auth/routing";
import { loginSchema, type LoginSchema } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [errorCode, setErrorCode] = useState<string | null>(
    searchParams.get("error")
  );
  const [submitting, setSubmitting] = useState(false);

  const callbackUrl = getSafeCallbackUrl(
    searchParams.get("callbackUrl"),
    DEFAULT_AUTHENTICATED_REDIRECT
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setErrorCode(null);

    try {
      const result = await login({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
        callbackUrl,
      });

      if (result?.error) {
        setErrorCode("invalid_credentials");
        setSubmitting(false);
        return;
      }

      // Success state placeholder — navigate into the workspace
      router.push(callbackUrl);
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

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">Password</Label>
          <Link
            href={AUTH_ROUTES.forgotPassword}
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <AuthPasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="rememberMe"
          type="checkbox"
          className="size-4 rounded border border-input accent-primary"
          {...register("rememberMe")}
        />
        <Label htmlFor="rememberMe" className="font-normal text-muted-foreground">
          Remember me
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
