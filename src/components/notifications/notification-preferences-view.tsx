"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PageContainer } from "@/components/common/page-container";
import { AppCard } from "@/components/cards/app-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateNotificationPreferences } from "@/actions/notification";
import {
  DEFAULT_CATEGORY_PREFERENCES,
  NOTIFICATION_CATEGORY_LABELS,
} from "@/config/notification";
import { toast } from "@/store/toast-store";
import type {
  NotificationCategoryId,
  NotificationPreference,
} from "@/types/notification";

type NotificationPreferencesViewProps = {
  preference: NotificationPreference;
  errorMessage?: string | null;
};

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
  disabled,
  placeholder,
}: {
  label: string;
  description?: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  placeholder?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">
          {label}
          {placeholder ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              Placeholder
            </span>
          ) : null}
        </p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Button
        type="button"
        variant={enabled ? "default" : "outline"}
        size="sm"
        className="rounded-lg"
        disabled={disabled}
        onClick={onToggle}
      >
        {enabled ? "Enabled" : "Disabled"}
      </Button>
    </div>
  );
}

export function NotificationPreferencesView({
  preference,
  errorMessage,
}: NotificationPreferencesViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function save(patch: unknown) {
    startTransition(async () => {
      const result = await updateNotificationPreferences(patch);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Preferences saved");
      router.refresh();
    });
  }

  const categories = {
    ...DEFAULT_CATEGORY_PREFERENCES,
    ...preference.categories,
  };

  return (
    <PageContainer
      title="Notification preferences"
      description="Control in-app alerts per category. Email, SMS, push, and WhatsApp are prepared as placeholders."
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <AppCard
          title="Channels"
          description="Delivery channels for your account"
          contentClassName="space-y-2"
        >
          <ToggleRow
            label="In-app"
            description="Show alerts in the notification center and bell"
            enabled={preference.channels.inApp}
            disabled={isPending}
            onToggle={() =>
              save({ channels: { inApp: !preference.channels.inApp } })
            }
          />
          <ToggleRow
            label="Email"
            description="Future email delivery"
            enabled={preference.channels.email}
            disabled={isPending}
            placeholder
            onToggle={() =>
              save({ channels: { email: !preference.channels.email } })
            }
          />
          <ToggleRow
            label="SMS"
            description="Future SMS delivery"
            enabled={preference.channels.sms}
            disabled={isPending}
            placeholder
            onToggle={() =>
              save({ channels: { sms: !preference.channels.sms } })
            }
          />
          <ToggleRow
            label="Push"
            description="Future push providers"
            enabled={preference.channels.push}
            disabled={isPending}
            placeholder
            onToggle={() =>
              save({ channels: { push: !preference.channels.push } })
            }
          />
          <ToggleRow
            label="WhatsApp"
            description="Future WhatsApp delivery"
            enabled={preference.channels.whatsapp}
            disabled={isPending}
            placeholder
            onToggle={() =>
              save({
                channels: { whatsapp: !preference.channels.whatsapp },
              })
            }
          />
        </AppCard>

        <AppCard
          title="Categories"
          description="Per-category in-app preferences"
          contentClassName="space-y-2"
        >
          {(
            Object.keys(NOTIFICATION_CATEGORY_LABELS) as NotificationCategoryId[]
          ).map((key) => (
            <ToggleRow
              key={key}
              label={NOTIFICATION_CATEGORY_LABELS[key]}
              enabled={categories[key] !== false}
              disabled={isPending}
              onToggle={() =>
                save({
                  categories: {
                    [key]: categories[key] === false,
                  },
                })
              }
            />
          ))}
        </AppCard>

        <AppCard
          title="Quiet hours"
          description="Placeholder — enforcement is not active yet"
          contentClassName="space-y-3"
        >
          <ToggleRow
            label="Quiet hours"
            description="Suppress non-critical alerts overnight"
            enabled={preference.quietHoursEnabled}
            disabled={isPending}
            placeholder
            onToggle={() =>
              save({ quietHoursEnabled: !preference.quietHoursEnabled })
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Start</span>
              <Input
                defaultValue={preference.quietHoursStart}
                className="rounded-xl"
                onBlur={(event) => {
                  const value = event.target.value.trim();
                  if (value && value !== preference.quietHoursStart) {
                    save({ quietHoursStart: value });
                  }
                }}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">End</span>
              <Input
                defaultValue={preference.quietHoursEnd}
                className="rounded-xl"
                onBlur={(event) => {
                  const value = event.target.value.trim();
                  if (value && value !== preference.quietHoursEnd) {
                    save({ quietHoursEnd: value });
                  }
                }}
              />
            </label>
          </div>
        </AppCard>
      </div>
    </PageContainer>
  );
}
