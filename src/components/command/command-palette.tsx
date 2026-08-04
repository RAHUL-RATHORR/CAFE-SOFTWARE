"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchOverlay } from "@/components/search/search-overlay";
import { SearchInput } from "@/components/search/search-input";
import { SearchResults } from "@/components/search/search-results";
import { RecentSearches } from "@/components/search/recent-searches";
import { EmptySearchState } from "@/components/search/empty-search-state";
import { SearchShortcutHint } from "@/components/search/search-shortcut-hint";
import {
  flattenSearchResults,
  groupSearchResults,
  searchCommands,
  useSearchStore,
} from "@/store/search-store";
import { useThemeStore } from "@/store/theme-store";
import type { SearchCommand, SearchResultGroup } from "@/types";

export function CommandPalette() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = useSearchStore((state) => state.isOpen);
  const query = useSearchStore((state) => state.query);
  const selectedIndex = useSearchStore((state) => state.selectedIndex);
  const recentSearches = useSearchStore((state) => state.recentSearches);
  const recentCommandIds = useSearchStore((state) => state.recentCommandIds);
  const closeSearch = useSearchStore((state) => state.closeSearch);
  const setQuery = useSearchStore((state) => state.setQuery);
  const setSelectedIndex = useSearchStore((state) => state.setSelectedIndex);
  const moveSelection = useSearchStore((state) => state.moveSelection);
  const addRecentSearch = useSearchStore((state) => state.addRecentSearch);
  const addRecentCommand = useSearchStore((state) => state.addRecentCommand);
  const clearRecentSearches = useSearchStore(
    (state) => state.clearRecentSearches
  );
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  const groups = useMemo((): SearchResultGroup[] => {
    if (query.trim()) {
      return groupSearchResults(query);
    }

    const recentCommands = recentCommandIds
      .map((id) => searchCommands.find((command) => command.id === id))
      .filter(Boolean) as SearchCommand[];

    const suggested = groupSearchResults("");
    const recentGroup: SearchResultGroup | null =
      recentCommands.length > 0
        ? {
            id: "recent-commands",
            label: "Recent commands",
            items: recentCommands,
          }
        : null;

    return [recentGroup, ...suggested].filter(Boolean) as SearchResultGroup[];
  }, [query, recentCommandIds]);

  const flatItems = useMemo(() => flattenSearchResults(groups), [groups]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSearch();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSelection(1, flatItems.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSelection(-1, flatItems.length);
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        moveSelection(event.shiftKey ? -1 : 1, flatItems.length);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const item = flatItems[selectedIndex];
        if (!item) return;

        addRecentCommand(item.id);
        if (query.trim()) addRecentSearch(query);

        if (item.actionType === "theme") {
          setMode(mode === "dark" ? "light" : "dark");
          closeSearch();
          return;
        }

        if (item.href) {
          router.push(item.href);
        }

        closeSearch();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    isOpen,
    flatItems,
    selectedIndex,
    query,
    mode,
    router,
    closeSearch,
    moveSelection,
    addRecentCommand,
    addRecentSearch,
    setMode,
  ]);

  const runCommand = (item: SearchCommand) => {
    addRecentCommand(item.id);
    if (query.trim()) addRecentSearch(query);

    if (item.actionType === "theme") {
      setMode(mode === "dark" ? "light" : "dark");
      closeSearch();
      return;
    }

    if (item.href) {
      router.push(item.href);
    }

    closeSearch();
  };

  const showEmpty = query.trim().length > 0 && flatItems.length === 0;

  return (
    <SearchOverlay open={isOpen} onClose={closeSearch}>
      <div className="border-b border-border">
        <div className="flex items-center gap-2 pr-3">
          <SearchInput
            ref={inputRef}
            value={query}
            onChange={setQuery}
            className="flex-1"
          />
          <SearchShortcutHint keys={["esc"]} />
        </div>
      </div>

      {!query.trim() ? (
        <RecentSearches
          items={recentSearches}
          onSelect={setQuery}
          onClear={clearRecentSearches}
        />
      ) : null}

      {showEmpty ? (
        <EmptySearchState query={query} />
      ) : (
        <SearchResults
          groups={groups}
          flatItems={flatItems}
          selectedIndex={selectedIndex}
          query={query}
          onHover={setSelectedIndex}
          onSelect={runCommand}
        />
      )}

      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        <span>↑ ↓ navigate · Enter open · Esc close · Tab next</span>
        <SearchShortcutHint />
      </div>
    </SearchOverlay>
  );
}
