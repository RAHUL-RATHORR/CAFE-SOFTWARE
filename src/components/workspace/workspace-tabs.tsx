"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Pin,
  RotateCcw,
  X,
} from "lucide-react";
import { getNavItemByHref } from "@/config/navigation";
import { WORKSPACE_TAB_SCROLL_STEP } from "@/constants/workspace";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTabStore } from "@/store/tab-store";
import type { WorkspaceTab } from "@/types/workspace";

type WorkspaceTabItemProps = {
  tab: WorkspaceTab;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
  onPin: () => void;
  onDuplicate: () => void;
};

function WorkspaceTabItem({
  tab,
  isActive,
  onActivate,
  onClose,
  onPin,
  onDuplicate,
}: WorkspaceTabItemProps) {
  const navItem = getNavItemByHref(tab.href);
  const Icon = navItem?.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96, x: 8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.96, x: -8 }}
      transition={{ duration: 0.16 }}
      className={cn(
        "group relative flex h-9 max-w-[200px] shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 px-2.5 text-xs transition-colors",
        isActive
          ? "border-border bg-background text-foreground"
          : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      role="tab"
      aria-selected={isActive}
      id={`workspace-tab-${tab.id}`}
      onContextMenu={(event) => {
        event.preventDefault();
        // Context menu placeholder — pin / duplicate available via store APIs
        onPin();
      }}
      onDoubleClick={() => onDuplicate()}
    >
      {isActive ? (
        <span
          className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
          aria-hidden
        />
      ) : null}

      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        onClick={onActivate}
        aria-label={`Activate ${tab.title} tab`}
      >
        {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
        <span className="truncate font-medium">{tab.title}</span>
        {tab.unsaved ? (
          <span
            className="size-1.5 shrink-0 rounded-full bg-amber-500"
            title="Unsaved changes (placeholder)"
            aria-label="Unsaved changes"
          />
        ) : null}
        {tab.pinned ? (
          <Pin className="size-3 shrink-0 text-muted-foreground" aria-hidden />
        ) : null}
      </button>

      {!tab.pinned ? (
        <button
          type="button"
          className={cn(
            "rounded-md p-0.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100",
            isActive && "opacity-100"
          )}
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          aria-label={`Close ${tab.title} tab`}
        >
          <X className="size-3" aria-hidden />
        </button>
      ) : null}

      {/* Context menu placeholder: right-click pins, double-click duplicates */}
      <span className="sr-only">
        Tab context menu placeholder. Right-click to pin. Double-click to
        duplicate.
      </span>
    </motion.div>
  );
}

export function WorkspaceTabs() {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const tabs = useTabStore((state) => state.tabs);
  const activeTabId = useTabStore((state) => state.activeTabId);
  const lastClosedTab = useTabStore((state) => state.lastClosedTab);
  const setActiveTab = useTabStore((state) => state.setActiveTab);
  const closeTab = useTabStore((state) => state.closeTab);
  const restoreLastTab = useTabStore((state) => state.restoreLastTab);
  const pinTab = useTabStore((state) => state.pinTab);
  const duplicateTab = useTabStore((state) => state.duplicateTab);

  const scrollBy = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({
      left: direction * WORKSPACE_TAB_SCROLL_STEP,
      behavior: "smooth",
    });
  };

  const activateTab = (tab: WorkspaceTab) => {
    setActiveTab(tab.id);
    router.push(tab.href);
  };

  const handleClose = (tab: WorkspaceTab) => {
    const closed = closeTab(tab.id);
    if (!closed) return;

    const nextId = useTabStore.getState().activeTabId;
    const next = useTabStore.getState().tabs.find((item) => item.id === nextId);
    if (next) {
      router.push(next.href);
    }
  };

  const handleRestore = () => {
    const id = restoreLastTab();
    if (!id) return;
    const restored = useTabStore.getState().tabs.find((tab) => tab.id === id);
    if (restored) router.push(restored.href);
  };

  if (tabs.length === 0) return null;

  return (
    <div
      className="flex items-end gap-1 border-b border-border bg-muted/20 px-2 pt-1.5 md:px-3"
      data-workspace-slot="tabs"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="mb-1 size-7 shrink-0"
        aria-label="Scroll tabs left"
        onClick={() => scrollBy(-1)}
      >
        <ChevronLeft className="size-3.5" />
      </Button>

      <div
        ref={scrollerRef}
        className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto scrollbar-thin"
        role="tablist"
        aria-label="Workspace tabs"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {tabs.map((tab) => (
            <WorkspaceTabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onActivate={() => activateTab(tab)}
              onClose={() => handleClose(tab)}
              onPin={() => pinTab(tab.id, !tab.pinned)}
              onDuplicate={() => duplicateTab(tab.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="mb-1 size-7 shrink-0"
        aria-label="Scroll tabs right"
        onClick={() => scrollBy(1)}
      >
        <ChevronRight className="size-3.5" />
      </Button>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mb-1 size-7 shrink-0"
              aria-label="Restore last closed tab (placeholder)"
              onClick={handleRestore}
              disabled={!lastClosedTab}
            />
          }
        >
          <RotateCcw className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>Restore last tab</TooltipContent>
      </Tooltip>

      </div>
  );
}
