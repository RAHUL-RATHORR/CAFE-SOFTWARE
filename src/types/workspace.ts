export type SidebarMode = "expanded" | "collapsed" | "mini";

export type WorkspaceViewState =
  | "ready"
  | "loading"
  | "empty"
  | "error"
  | "offline"
  | "maintenance";

export type WorkspaceTab = {
  id: string;
  title: string;
  href: string;
  /** Optional icon key aligned with nav / Lucide usage */
  icon?: string;
  pinned?: boolean;
  /** Placeholder for unsaved edits indicator */
  unsaved?: boolean;
};

export type WorkspaceTabContextAction =
  | "close"
  | "close-others"
  | "close-all"
  | "duplicate"
  | "pin"
  | "restore-last";

export type WorkspaceToolbarSlot =
  | "search"
  | "breadcrumb"
  | "actions"
  | "refresh"
  | "fullscreen"
  | "settings";
