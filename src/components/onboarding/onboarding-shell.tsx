"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Utensils } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type OnboardingShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Minimal authenticated shell for onboarding (no dashboard AppShell).
 */
export function OnboardingShell({ children, className }: OnboardingShellProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--muted)_0%,_var(--background)_55%)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 18%, color-mix(in oklch, var(--primary) 18%, transparent), transparent 42%), radial-gradient(circle at 88% 8%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 36%)",
        }}
        aria-hidden
      />

      <header className="relative border-b border-border/60 bg-background/70 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/onboarding"
            className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Utensils className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">
                {siteConfig.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                Restaurant onboarding
              </span>
            </span>
          </Link>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Multi-tenant setup
          </p>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
