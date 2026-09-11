"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Bell,
  ChefHat,
  GitBranch,
  Maximize2,
  Minimize2,
  RefreshCw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KitchenBoardView } from "@/components/kitchen/kitchen-board-view";
import { KitchenDetailsDrawer } from "@/components/kitchen/kitchen-details-drawer";
import {
  isKitchenSoundMuted,
  setKitchenSoundMuted,
} from "@/lib/kitchen/kitchen-audio";
import { useKitchenRealtime } from "@/hooks/kitchen";
import { groupTicketsByBoard } from "@/lib/kitchen/tickets";
import { getKitchenDashboard } from "@/actions/kitchen";
import { cn } from "@/lib/utils";
import type {
  KitchenDashboardData,
  KitchenFilterOptions,
  KitchenTicket,
} from "@/types/kitchen";

type KitchenDashboardProps = {
  data: KitchenDashboardData;
  filterOptions: KitchenFilterOptions;
  query: {
    q: string;
    branchId: string;
    status: string;
    orderType: string;
    orderSource: string;
    priority: string;
    tableId: string;
    assignedChefId: string;
    view: "board" | "queue";
  };
  errorMessage?: string | null;
};

export function KitchenDashboard({
  data: initialData,
  filterOptions,
  query,
  errorMessage,
}: KitchenDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Local reactive ticket state
  const [tickets, setTickets] = useState<KitchenTicket[]>(initialData.tickets);
  const [selectedTicket, setSelectedTicket] = useState<KitchenTicket | null>(null);

  // Settings: sound mute & fullscreen & density
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompact] = useState(false);

  useEffect(() => {
    setIsMuted(isKitchenSoundMuted());
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Update tickets if props change
  useEffect(() => {
    setTickets(initialData.tickets);
  }, [initialData.tickets]);

  // Synchronize with server
  const syncWithServer = useCallback(async () => {
    const result = await getKitchenDashboard({
      branchId: query.branchId,
      status: query.status,
      orderType: query.orderType,
      orderSource: query.orderSource,
      priority: query.priority,
      tableId: query.tableId,
      assignedChefId: query.assignedChefId,
    });
    if (result.success) {
      setTickets(result.data.tickets);
    }
  }, [query]);

  // Real-Time SSE Connection
  const { connectionStatus, newOrderAlert, dismissAlert } = useKitchenRealtime({
    branchId: query.branchId || initialData.activeBranchId,
    onNewOrder: () => {
      // Refresh tickets from server on new order
      syncWithServer();
    },
    onOrderUpdated: (payload) => {
      if (payload.order) {
        setTickets((prev) => {
          const updated = prev.map((t) =>
            t.id === payload.orderId ? { ...t, ...payload.order! } : t
          );
          // If not in list, sync
          if (!prev.some((t) => t.id === payload.orderId)) {
            syncWithServer();
          }
          return updated;
        });
      } else {
        syncWithServer();
      }
    },
    onOrderCancelled: (payload) => {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === payload.orderId
            ? { ...t, status: "cancelled", boardColumn: "new" as const }
            : t
        )
      );
    },
    onSyncRequired: () => {
      syncWithServer();
    },
  });

  const updateParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  function toggleMute() {
    const next = !isMuted;
    setIsMuted(next);
    setKitchenSoundMuted(next);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        /* fullscreen not permitted */
      });
    } else {
      document.exitFullscreen().catch(() => {
        /* exit failed */
      });
    }
  }

  // Group active tickets into columns
  const board = groupTicketsByBoard(tickets);

  // Active branch label
  const currentBranch = filterOptions.branches.find(
    (b) => b.id === (query.branchId || initialData.activeBranchId)
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Error Message Banner if any */}
      {errorMessage && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm font-semibold text-destructive">
          {errorMessage}
        </div>
      )}

      {/* New Order Alert Banner */}
      {newOrderAlert && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-foreground shadow-md animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-emerald-600 animate-bounce" />
            <span className="text-sm font-bold">
              New Order #{newOrderAlert.orderNumber}
              {newOrderAlert.tableLabel ? ` · ${newOrderAlert.tableLabel}` : ""}
            </span>
            <span className="text-xs text-muted-foreground">
              ({newOrderAlert.time})
            </span>
          </div>
          <button
            type="button"
            onClick={dismissAlert}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* KDS Streamlined Kitchen Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 sm:p-4 shadow-sm">
        {/* Left: DineFlow KDS Title & Branch */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              <ChefHat className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground leading-tight">
                DineFlow KDS
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Kitchen Display System
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-border/60 mx-1 hidden sm:block" />

          {/* Branch selector / badge */}
          {filterOptions.canSwitchBranch && filterOptions.branches.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <GitBranch className="size-3.5 text-muted-foreground" />
              <select
                value={query.branchId}
                onChange={(e) => updateParams({ branchId: e.target.value })}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Branches</option>
                {filterOptions.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : currentBranch ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/80 px-2.5 py-1 text-xs font-semibold text-foreground">
              <GitBranch className="size-3.5 text-primary" />
              {currentBranch.name}
            </span>
          ) : null}
        </div>

        {/* Right Controls: Live status, Sound, Fullscreen, Density, Refresh */}
        <div className="flex items-center gap-2">
          {/* Connection Status Pill */}
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tracking-tight border",
              connectionStatus === "connected" &&
                "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
              connectionStatus === "reconnecting" &&
                "border-amber-500/30 bg-amber-500/10 text-amber-600 animate-pulse",
              connectionStatus === "disconnected" &&
                "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                connectionStatus === "connected" && "bg-emerald-500",
                connectionStatus === "reconnecting" && "bg-amber-500",
                connectionStatus === "disconnected" && "bg-destructive"
              )}
            />
            {connectionStatus === "connected" && "Kitchen Live"}
            {connectionStatus === "reconnecting" && "Reconnecting…"}
            {connectionStatus === "disconnected" && "Connection Lost"}
          </div>

          {/* Sound Mute Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleMute}
            className="h-8 w-8 p-0 rounded-lg"
            title={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? (
              <VolumeX className="size-4 text-muted-foreground" />
            ) : (
              <Volume2 className="size-4 text-primary" />
            )}
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0 rounded-lg"
            title={isFullscreen ? "Exit Fullscreen" : "Full Screen"}
          >
            {isFullscreen ? (
              <Minimize2 className="size-4 text-foreground" />
            ) : (
              <Maximize2 className="size-4 text-foreground" />
            )}
          </Button>

          {/* Manual Refresh Sync */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => syncWithServer()}
            className="h-8 w-8 p-0 rounded-lg"
            title="Sync Orders"
          >
            <RefreshCw className="size-4 text-foreground" />
          </Button>
        </div>
      </div>

      {/* Main KDS Columns View */}
      <KitchenBoardView
        board={board}
        compact={isCompact}
        onSelectDetails={(ticket) => setSelectedTicket(ticket)}
        onStatusChanged={(updatedTicket) => {
          setTickets((prev) =>
            prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
          );
        }}
      />

      {/* Order Details Modal Drawer */}
      <KitchenDetailsDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
