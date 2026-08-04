"use client";

import { create } from "zustand";
import {
  searchCommands,
  suggestedCommands,
} from "@/store/data/search-commands";
import type { SearchCommand, SearchResultGroup } from "@/types";
import { searchCategoryLabels } from "@/store/data/search-commands";

const MAX_RECENT = 6;

type SearchState = {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  recentSearches: string[];
  recentCommandIds: string[];
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  setQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  moveSelection: (delta: number, total: number) => void;
  addRecentSearch: (query: string) => void;
  addRecentCommand: (commandId: string) => void;
  clearRecentSearches: () => void;
};

function filterCommands(query: string): SearchCommand[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return suggestedCommands;

  return searchCommands.filter((command) => {
    const haystack = [
      command.title,
      command.description ?? "",
      command.category,
      ...(command.keywords ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function groupSearchResults(query: string): SearchResultGroup[] {
  const items = filterCommands(query);
  if (items.length === 0) return [];

  if (!query.trim()) {
    return [
      {
        id: "suggested",
        label: "Suggested",
        items: items.filter((item) => item.pinned || item.favorite),
      },
      {
        id: "navigation",
        label: "Quick navigation",
        items: items.filter((item) => !item.pinned && !item.favorite),
      },
    ].filter((group) => group.items.length > 0);
  }

  const byCategory = new Map<string, SearchCommand[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  return Array.from(byCategory.entries()).map(([category, groupItems]) => ({
    id: category,
    label: searchCategoryLabels[category as keyof typeof searchCategoryLabels],
    items: groupItems,
  }));
}

export function flattenSearchResults(groups: SearchResultGroup[]): SearchCommand[] {
  return groups.flatMap((group) => group.items);
}

export const useSearchStore = create<SearchState>((set, get) => ({
  isOpen: false,
  query: "",
  selectedIndex: 0,
  recentSearches: ["orders", "kitchen", "billing"],
  recentCommandIds: ["go-dashboard", "open-kitchen", "create-order"],
  openSearch: () => set({ isOpen: true, selectedIndex: 0 }),
  closeSearch: () => set({ isOpen: false, query: "", selectedIndex: 0 }),
  toggleSearch: () => {
    const { isOpen } = get();
    if (isOpen) {
      get().closeSearch();
    } else {
      get().openSearch();
    }
  },
  setQuery: (query) => set({ query, selectedIndex: 0 }),
  setSelectedIndex: (index) => set({ selectedIndex: Math.max(0, index) }),
  moveSelection: (delta, total) => {
    if (total <= 0) {
      set({ selectedIndex: 0 });
      return;
    }
    const current = get().selectedIndex;
    const next = (current + delta + total) % total;
    set({ selectedIndex: next });
  },
  addRecentSearch: (query) => {
    const value = query.trim();
    if (!value) return;
    const next = [
      value,
      ...get().recentSearches.filter((item) => item !== value),
    ].slice(0, MAX_RECENT);
    set({ recentSearches: next });
  },
  addRecentCommand: (commandId) => {
    const next = [
      commandId,
      ...get().recentCommandIds.filter((id) => id !== commandId),
    ].slice(0, MAX_RECENT);
    set({ recentCommandIds: next });
  },
  clearRecentSearches: () => set({ recentSearches: [] }),
}));

export { searchCommands, suggestedCommands };
