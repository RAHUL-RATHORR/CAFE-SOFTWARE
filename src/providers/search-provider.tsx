"use client";

import { useCallback, type ReactNode } from "react";
import { CommandPalette } from "@/components/command/command-palette";
import {
  useCommandPaletteShortcut,
  useKeyboardShortcuts,
} from "@/hooks/use-keyboard-shortcuts";
import { useSearchStore } from "@/store/search-store";

type SearchProviderProps = {
  children: ReactNode;
};

/**
 * Registers global search shortcuts and hosts the command palette.
 */
export function SearchProvider({ children }: SearchProviderProps) {
  const toggleSearch = useSearchStore((state) => state.toggleSearch);
  const onToggle = useCallback(() => toggleSearch(), [toggleSearch]);

  useKeyboardShortcuts(true);
  useCommandPaletteShortcut(onToggle, true);

  return (
    <>
      {children}
      <CommandPalette />
    </>
  );
}
