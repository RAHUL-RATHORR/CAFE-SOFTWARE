"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PreferenceSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function PreferenceSection({
  title,
  description,
  children,
  className,
}: PreferenceSectionProps) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm",
        className
      )}
    >
      <header className="space-y-1 border-b border-border pb-3">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

type PreferenceRowProps = {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function PreferenceRow({
  label,
  description,
  children,
  className,
}: PreferenceRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0 sm:max-w-xs sm:min-w-[220px]">{children}</div>
    </div>
  );
}

type PreferenceSelectProps = {
  label: string;
  value: string;
  options: readonly { label: string; value: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function PreferenceSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: PreferenceSelectProps) {
  return (
    <label className="block w-full">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type PreferenceSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

export function PreferenceSwitch({
  checked,
  onChange,
  label,
  disabled,
}: PreferenceSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted",
        disabled && "opacity-50"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}
