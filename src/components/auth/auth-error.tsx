"use client";

import { AlertTriangle, Ban, WifiOff, Clock, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveAuthErrorMessage } from "@/lib/auth/errors";
import type { AuthErrorCode } from "@/types/auth";

const icons: Record<AuthErrorCode, typeof AlertTriangle> = {
  invalid_credentials: AlertTriangle,
  session_expired: Clock,
  unauthorized: Ban,
  forbidden: ShieldOff,
  network_error: WifiOff,
  unknown: AlertTriangle,
};

type AuthErrorProps = {
  code?: string | null;
  message?: string;
  className?: string;
};

export function AuthError({ code, message, className }: AuthErrorProps) {
  if (!code && !message) return null;

  const resolved = resolveAuthErrorMessage(code);
  const Icon = icons[resolved.code];
  const text = message ?? resolved.message;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive",
        className
      )}
      data-auth-error={resolved.code}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{text}</p>
    </div>
  );
}
