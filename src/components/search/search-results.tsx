"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SearchCommand } from "@/types";

function highlightMatch(text: string | undefined, query: string): ReactNode {
  if (!text) return text ?? null;
  const normalized = query.trim();
  if (!normalized) return text;

  const index = text.toLowerCase().indexOf(normalized.toLowerCase());
  if (index < 0) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + normalized.length);
  const after = text.slice(index + normalized.length);

  return (
    <>
      {before}
      <mark className="rounded-sm bg-primary/15 px-0.5 text-foreground">{match}</mark>
      {after}
    </>
  );
}

type SearchItemProps = {
  item: SearchCommand;
  active?: boolean;
  query?: string;
  onSelect?: () => void;
  onMouseEnter?: () => void;
};

export function SearchItem({
  item,
  active = false,
  query = "",
  onSelect,
  onMouseEnter,
}: SearchItemProps) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        active ? "bg-accent text-accent-foreground" : "hover:bg-muted/70"
      )}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-xl",
          active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {Icon ? <Icon className="size-4" aria-hidden /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {highlightMatch(item.title, query)}
        </p>
        {item.description ? (
          <p className="truncate text-xs text-muted-foreground">
            {highlightMatch(item.description, query)}
          </p>
        ) : null}
      </div>
      {item.pinned ? (
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          Pinned
        </span>
      ) : null}
      {item.favorite ? (
        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          Favorite
        </span>
      ) : null}
    </button>
  );
}

type SearchSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function SearchSection({ title, children, className }: SearchSectionProps) {
  return (
    <section className={cn("space-y-1", className)}>
      <h3 className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

export function SearchCategory({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return <SearchSection title={label}>{children}</SearchSection>;
}

type SearchResultsProps = {
  groups: { id: string; label: string; items: SearchCommand[] }[];
  flatItems: SearchCommand[];
  selectedIndex: number;
  query: string;
  onHover: (index: number) => void;
  onSelect: (item: SearchCommand) => void;
};

export function SearchResults({
  groups,
  flatItems,
  selectedIndex,
  query,
  onHover,
  onSelect,
}: SearchResultsProps) {
  let runningIndex = -1;

  return (
    <div className="max-h-[360px] space-y-3 overflow-y-auto px-2 py-2" role="listbox">
      {groups.map((group) => (
        <motion.div
          key={group.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <SearchCategory label={group.label}>
            {group.items.map((item) => {
              runningIndex += 1;
              const index = runningIndex;
              return (
                <SearchItem
                  key={item.id}
                  item={item}
                  query={query}
                  active={selectedIndex === index}
                  onMouseEnter={() => onHover(index)}
                  onSelect={() => onSelect(item)}
                />
              );
            })}
          </SearchCategory>
        </motion.div>
      ))}
      {flatItems.length === 0 ? null : (
        <span className="sr-only">
          {flatItems.length} result{flatItems.length === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}
