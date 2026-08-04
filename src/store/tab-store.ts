"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  WORKSPACE_MAX_TABS,
  WORKSPACE_TABS_STORAGE_KEY,
} from "@/constants/workspace";
import type { WorkspaceTab } from "@/types/workspace";

type OpenTabInput = {
  title: string;
  href: string;
  icon?: string;
  pinned?: boolean;
  unsaved?: boolean;
};

type TabState = {
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  lastClosedTab: WorkspaceTab | null;
  maxTabs: number;
  hasHydrated: boolean;
  openTab: (input: OpenTabInput) => string;
  closeTab: (id: string) => WorkspaceTab | null;
  setActiveTab: (id: string) => void;
  pinTab: (id: string, pinned?: boolean) => void;
  duplicateTab: (id: string) => string | null;
  closeOtherTabs: (id: string) => void;
  closeAllTabs: () => void;
  restoreLastTab: () => string | null;
  setUnsaved: (id: string, unsaved: boolean) => void;
  setMaxTabs: (max: number) => void;
  setHasHydrated: (value: boolean) => void;
};

function createTabId(href: string): string {
  return `tab:${href}`;
}

function findByHref(tabs: WorkspaceTab[], href: string) {
  return tabs.find((tab) => tab.href === href);
}

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      lastClosedTab: null,
      maxTabs: WORKSPACE_MAX_TABS,
      hasHydrated: false,

      openTab: (input) => {
        const existing = findByHref(get().tabs, input.href);
        if (existing) {
          set({ activeTabId: existing.id });
          return existing.id;
        }

        const { tabs, maxTabs } = get();
        let nextTabs = [...tabs];

        if (nextTabs.length >= maxTabs) {
          const removableIndex = nextTabs.findIndex((tab) => !tab.pinned);
          if (removableIndex === -1) {
            set({ activeTabId: nextTabs[0]?.id ?? null });
            return nextTabs[0]?.id ?? createTabId(input.href);
          }
          nextTabs.splice(removableIndex, 1);
        }

        const tab: WorkspaceTab = {
          id: createTabId(input.href),
          title: input.title,
          href: input.href,
          icon: input.icon,
          pinned: input.pinned ?? false,
          unsaved: input.unsaved ?? false,
        };

        nextTabs = [...nextTabs, tab];
        set({ tabs: nextTabs, activeTabId: tab.id });
        return tab.id;
      },

      closeTab: (id) => {
        const { tabs, activeTabId } = get();
        const index = tabs.findIndex((tab) => tab.id === id);
        if (index === -1) return null;

        const [closed] = tabs.slice(index, index + 1);
        if (closed.pinned) return null;

        const nextTabs = tabs.filter((tab) => tab.id !== id);
        let nextActive = activeTabId;

        if (activeTabId === id) {
          const neighbor = nextTabs[index] ?? nextTabs[index - 1] ?? null;
          nextActive = neighbor?.id ?? null;
        }

        set({
          tabs: nextTabs,
          activeTabId: nextActive,
          lastClosedTab: closed,
        });

        return closed;
      },

      setActiveTab: (id) => {
        if (!get().tabs.some((tab) => tab.id === id)) return;
        set({ activeTabId: id });
      },

      pinTab: (id, pinned = true) => {
        set({
          tabs: get().tabs.map((tab) =>
            tab.id === id ? { ...tab, pinned } : tab
          ),
        });
      },

      duplicateTab: (id) => {
        const source = get().tabs.find((tab) => tab.id === id);
        if (!source) return null;
        return get().openTab({
          title: `${source.title} (Copy)`,
          href: source.href,
          icon: source.icon,
          pinned: false,
          unsaved: source.unsaved,
        });
      },

      closeOtherTabs: (id) => {
        const keep = get().tabs.find((tab) => tab.id === id);
        if (!keep) return;
        const pinnedOthers = get().tabs.filter(
          (tab) => tab.id !== id && tab.pinned
        );
        set({
          tabs: [...pinnedOthers, keep],
          activeTabId: keep.id,
        });
      },

      closeAllTabs: () => {
        const pinned = get().tabs.filter((tab) => tab.pinned);
        set({
          tabs: pinned,
          activeTabId: pinned[0]?.id ?? null,
        });
      },

      restoreLastTab: () => {
        const last = get().lastClosedTab;
        if (!last) return null;
        const id = get().openTab({
          title: last.title,
          href: last.href,
          icon: last.icon,
          pinned: last.pinned,
          unsaved: last.unsaved,
        });
        set({ lastClosedTab: null });
        return id;
      },

      setUnsaved: (id, unsaved) => {
        set({
          tabs: get().tabs.map((tab) =>
            tab.id === id ? { ...tab, unsaved } : tab
          ),
        });
      },

      setMaxTabs: (max) => set({ maxTabs: Math.max(1, max) }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: WORKSPACE_TABS_STORAGE_KEY,
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        lastClosedTab: state.lastClosedTab,
        maxTabs: state.maxTabs,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
