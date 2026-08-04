"use client";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/common/page-container";
import {
  PreferenceSection,
  PreferenceRow,
  PreferenceSelect,
  PreferenceSwitch,
} from "@/components/preferences/preference-controls";
import {
  ThemePreviewCard,
  ThemeSwitcher,
  ThemeMenu,
} from "@/components/theme";
import { preferenceOptions } from "@/config/preferences";
import { usePreferencesStore } from "@/store/preferences-store";
import { useUiStore } from "@/store/ui-store";
import type { Density, TimeFormat } from "@/types";

export function PreferencesView({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const preferences = usePreferencesStore();
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);
  const {
    setPreference,
    resetPreferences,
    language,
    currency,
    timezone,
    dateFormat,
    timeFormat,
    compactMode,
    sidebarDefaultCollapsed,
    animationsEnabled,
    reducedMotion,
    dashboardDensity,
    tableDensity,
    notificationSound,
  } = preferences;

  const content = (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <PreferenceSection
          title="Browser preferences"
          description="Local UI preferences saved in this browser only"
        >
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={resetPreferences}
            >
              Reset defaults
            </Button>
          </div>
        </PreferenceSection>

        <PreferenceSection
          title="Appearance"
          description="Theme and visual style for the workspace"
        >
          <PreferenceRow
            label="Theme mode"
            description="Choose light, dark, or follow system"
          >
            <ThemeSwitcher />
          </PreferenceRow>
          <ThemePreviewCard />
          <PreferenceRow
            label="Theme menu"
            description="Dropdown alternative for theme selection"
          >
            <ThemeMenu />
          </PreferenceRow>
        </PreferenceSection>

        <PreferenceSection
          title="Display"
          description="Density and layout preferences"
        >
          <PreferenceRow
            label="Compact mode"
            description="Reduce padding across the shell"
          >
            <PreferenceSwitch
              label="Compact mode"
              checked={compactMode}
              onChange={(value) => setPreference("compactMode", value)}
            />
          </PreferenceRow>
          <PreferenceRow
            label="Sidebar default"
            description="Collapse sidebar by default on desktop"
          >
            <PreferenceSwitch
              label="Sidebar collapsed by default"
              checked={sidebarDefaultCollapsed}
              onChange={(value) => {
                setPreference("sidebarDefaultCollapsed", value);
                setSidebarCollapsed(value);
              }}
            />
          </PreferenceRow>
          <PreferenceRow label="Dashboard density">
            <PreferenceSelect
              label="Dashboard density"
              value={dashboardDensity}
              options={preferenceOptions.densities}
              onChange={(value) =>
                setPreference("dashboardDensity", value as Density)
              }
            />
          </PreferenceRow>
          <PreferenceRow label="Table density">
            <PreferenceSelect
              label="Table density"
              value={tableDensity}
              options={preferenceOptions.densities}
              onChange={(value) =>
                setPreference("tableDensity", value as Density)
              }
            />
          </PreferenceRow>
        </PreferenceSection>

        <PreferenceSection
          title="Localization"
          description="Language, currency, and time placeholders"
        >
          <PreferenceRow label="Language">
            <PreferenceSelect
              label="Language"
              value={language}
              options={preferenceOptions.languages}
              onChange={(value) => setPreference("language", value)}
            />
          </PreferenceRow>
          <PreferenceRow label="Currency">
            <PreferenceSelect
              label="Currency"
              value={currency}
              options={preferenceOptions.currencies}
              onChange={(value) => setPreference("currency", value)}
            />
          </PreferenceRow>
          <PreferenceRow label="Timezone">
            <PreferenceSelect
              label="Timezone"
              value={timezone}
              options={preferenceOptions.timezones}
              onChange={(value) => setPreference("timezone", value)}
            />
          </PreferenceRow>
          <PreferenceRow label="Date format">
            <PreferenceSelect
              label="Date format"
              value={dateFormat}
              options={preferenceOptions.dateFormats}
              onChange={(value) => setPreference("dateFormat", value)}
            />
          </PreferenceRow>
          <PreferenceRow label="Time format">
            <PreferenceSelect
              label="Time format"
              value={timeFormat}
              options={[
                { label: "12-hour", value: "12h" },
                { label: "24-hour", value: "24h" },
              ]}
              onChange={(value) =>
                setPreference("timeFormat", value as TimeFormat)
              }
            />
          </PreferenceRow>
        </PreferenceSection>

        <PreferenceSection
          title="Accessibility"
          description="Motion and interaction comfort"
        >
          <PreferenceRow
            label="Enable animations"
            description="Subtle transitions across the UI"
          >
            <PreferenceSwitch
              label="Enable animations"
              checked={animationsEnabled}
              onChange={(value) => setPreference("animationsEnabled", value)}
            />
          </PreferenceRow>
          <PreferenceRow
            label="Reduced motion"
            description="Minimize non-essential motion"
          >
            <PreferenceSwitch
              label="Reduced motion"
              checked={reducedMotion}
              onChange={(value) => setPreference("reducedMotion", value)}
            />
          </PreferenceRow>
        </PreferenceSection>

        <PreferenceSection
          title="Dashboard Preferences"
          description="Operational workspace defaults"
        >
          <PreferenceRow
            label="Notification sound"
            description="Placeholder — no audio is played"
          >
            <PreferenceSwitch
              label="Notification sound"
              checked={notificationSound}
              onChange={(value) => setPreference("notificationSound", value)}
            />
          </PreferenceRow>
        </PreferenceSection>
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <PageContainer
      title="Preferences"
      description="Manage appearance and local UI preferences. Changes are saved in this browser only."
      actions={
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={resetPreferences}
        >
          Reset defaults
        </Button>
      }
    >
      {content}
    </PageContainer>
  );
}
