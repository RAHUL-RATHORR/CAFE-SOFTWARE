"use client";

import { useEffect } from "react";

export type ShortcutHandler = (event: KeyboardEvent) => void;

export type ShortcutDefinition = {
  id: string;
  keys: string[];
  handler: ShortcutHandler;
  description?: string;
  enabled?: boolean;
  preventDefault?: boolean;
};

type ShortcutRegistry = Map<string, ShortcutDefinition>;

const registry: ShortcutRegistry = new Map();

function normalizeKey(key: string | undefined) {
  return (key ?? "").toLowerCase();
}

function eventMatches(event: KeyboardEvent, keys: string[]) {
  const pressed = new Set<string>();
  if (event.metaKey || event.ctrlKey) pressed.add("mod");
  if (event.shiftKey) pressed.add("shift");
  if (event.altKey) pressed.add("alt");
  pressed.add(normalizeKey(event.key));

  const required = keys.map(normalizeKey);
  if (required.length !== pressed.size) {
    // Allow mod+k style where size may differ due to key naming
  }

  return required.every((key) => {
    if (key === "mod") return event.metaKey || event.ctrlKey;
    if (key === "shift") return event.shiftKey;
    if (key === "alt") return event.altKey;
    if (key === "escape") return event.key === "Escape";
    if (key === "enter") return event.key === "Enter";
    if (key === "tab") return event.key === "Tab";
    if (key === "arrowup") return event.key === "ArrowUp";
    if (key === "arrowdown") return event.key === "ArrowDown";
    return normalizeKey(event.key) === key;
  });
}

export function registerShortcut(definition: ShortcutDefinition) {
  registry.set(definition.id, definition);
  return () => {
    registry.delete(definition.id);
  };
}

export function unregisterShortcut(id: string) {
  registry.delete(id);
}

/**
 * Global shortcut listener for future registrations.
 * Mount once near the app root.
 */
export function useKeyboardShortcuts(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of registry.values()) {
        if (shortcut.enabled === false) continue;
        if (!eventMatches(event, shortcut.keys)) continue;
        if (shortcut.preventDefault !== false) event.preventDefault();
        shortcut.handler(event);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}

/**
 * Registers Ctrl/Cmd + K to toggle the command palette.
 */
export function useCommandPaletteShortcut(
  onToggle: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    return registerShortcut({
      id: "command-palette",
      keys: ["mod", "k"],
      description: "Open command palette",
      handler: () => onToggle(),
    });
  }, [onToggle, enabled]);
}
