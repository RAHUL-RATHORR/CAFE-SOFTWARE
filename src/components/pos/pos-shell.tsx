"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import {
  Utensils,
  ShoppingBag,
  Maximize2,
  Minimize2,
  Clock,
  Search,
  History,
  Building2,
  Plus,
  CircleDot,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBillingMoney, computeDiscountAmount, calculateGstTaxBreakdown } from "@/lib/billing";
import { getPosCatalog, getPosTables } from "@/actions/billing";
import { openCashDrawerAction } from "@/actions/printer";
import { toast } from "@/store/toast-store";
import { PosCart } from "@/components/pos/pos-cart";
import { PosItemCustomizerModal } from "@/components/pos/pos-item-customizer-modal";
import { PosCheckoutModal } from "@/components/pos/pos-checkout-modal";
import { PosInvoiceModal } from "@/components/pos/pos-invoice-modal";
import { PosBillingHistoryModal } from "@/components/pos/pos-billing-history-modal";
import type {
  PosBranchOption,
  PosTableOption,
  PosCatalog,
  PosCatalogItem,
  PosCartItem,
  PosCartLineCustomization,
  PosCheckoutResult,
  DiscountType,
  Bill,
} from "@/types/billing";
import { cn } from "@/lib/utils";

type PosShellProps = {
  branches: PosBranchOption[];
  initialBranchId: string;
  canSwitchBranch: boolean;
  initialCatalog: PosCatalog;
  initialTables: PosTableOption[];
  taxRate?: number;
};

export function PosShell({
  branches,
  initialBranchId,
  canSwitchBranch,
  initialCatalog,
  initialTables,
  taxRate = 5,
}: PosShellProps) {
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId);
  const [catalog, setCatalog] = useState<PosCatalog>(initialCatalog);
  const [tables, setTables] = useState<PosTableOption[]>(initialTables);
  const [, startTransition] = useTransition();

  // Order Type & Table
  const [orderType, setOrderType] = useState<"dine-in" | "take-away">("dine-in");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(
    initialTables.length > 0 ? initialTables[0].id : null
  );

  // Search & Category Filter
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Cart State
  const [cartItems, setCartItems] = useState<PosCartItem[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>("fixed");
  const [discountValue, setDiscountValue] = useState(0);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Clock
  const [currentTime, setCurrentTime] = useState("");

  // Modals state
  const [customizingItem, setCustomizingItem] = useState<PosCatalogItem | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<PosCheckoutResult | null>(null);
  const [reprintBill, setReprintBill] = useState<Bill | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Clock interval
  useEffect(() => {
    function updateClock() {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Refresh catalog and tables on branch switch
  function handleBranchChange(newBranchId: string) {
    setSelectedBranchId(newBranchId);
    startTransition(async () => {
      const [catRes, tabRes] = await Promise.all([
        getPosCatalog(newBranchId),
        getPosTables(newBranchId),
      ]);
      if (catRes.success) setCatalog(catRes.data);
      if (tabRes.success) {
        setTables(tabRes.data);
        if (tabRes.data.length > 0) {
          setSelectedTableId(tabRes.data[0].id);
        } else {
          setSelectedTableId(null);
        }
      }
    });
  }

  // Toggle fullscreen
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }

  // Filter menu items
  const filteredItems = useMemo(() => {
    return catalog.items.filter((item) => {
      const matchesCategory =
        selectedCategoryId === "all" || item.categoryId === selectedCategoryId;
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [catalog.items, selectedCategoryId, searchQuery]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    return computeDiscountAmount(subtotal, discountType, discountValue);
  }, [subtotal, discountType, discountValue]);

  const taxableBase = Math.max(0, subtotal - discountAmount);

  const gstBreakdown = useMemo(() => {
    return calculateGstTaxBreakdown({
      taxableAmount: taxableBase,
      taxRate,
      taxMode: "exclusive",
    });
  }, [taxableBase, taxRate]);

  const grandTotal = Math.round((taxableBase + gstBreakdown.totalTax + Number.EPSILON) * 100) / 100;

  // Add item handler
  function handleAddItemClick(item: PosCatalogItem) {
    if (item.customizationGroups && item.customizationGroups.length > 0) {
      setCustomizingItem(item);
    } else {
      // Add directly
      addItemToCart(item, 1, "", []);
    }
  }

  function addItemToCart(
    item: PosCatalogItem,
    quantity: number,
    notes: string,
    customizations: PosCartLineCustomization[],
    unitPriceOverride?: number
  ) {
    const finalUnitPrice = unitPriceOverride ?? item.price;
    const customKey = customizations.map((c) => `${c.groupId}:${c.optionId}`).sort().join("|");
    const cartKey = `${item.id}-${customKey}-${notes}`;

    setCartItems((prev) => {
      const existing = prev.find((p) => p.key === cartKey);
      if (existing) {
        return prev.map((p) =>
          p.key === cartKey ? { ...p, quantity: p.quantity + quantity } : p
        );
      }
      return [
        ...prev,
        {
          key: cartKey,
          menuItemId: item.id,
          name: item.name,
          price: finalUnitPrice,
          quantity,
          notes,
          modifiers: [],
          customizations,
        },
      ];
    });
  }

  function handleIncrease(key: string) {
    setCartItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  function handleDecrease(key: string) {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function handleRemove(key: string) {
    setCartItems((prev) => prev.filter((item) => item.key !== key));
  }

  function handleClearCart() {
    setCartItems([]);
    setDiscountValue(0);
  }

  function handleOrderCompleted(result: PosCheckoutResult) {
    setCheckoutResult(result);
    setReprintBill(null);
    setShowCheckoutModal(false);
    setShowInvoiceModal(true);
  }

  function handleNewOrder() {
    handleClearCart();
    setCheckoutResult(null);
    setReprintBill(null);
    setShowInvoiceModal(false);
  }

  function handleOpenReprint(bill: Bill) {
    setReprintBill(bill);
    setCheckoutResult(null);
    setShowHistoryModal(false);
    setShowInvoiceModal(true);
  }

  async function handleOpenCashDrawer() {
    try {
      const res = await openCashDrawerAction(undefined, selectedBranchId);
      if (res.success && res.data?.status === "PRINTED") {
        toast.success("Cash drawer kicked open.");
      } else {
        toast.info("Cash drawer signal sent.");
      }
    } catch {
      toast.error("Failed to kick cash drawer.");
    }
  }

  return (
    <div className="flex h-[calc(100vh-4.25rem)] w-full overflow-hidden bg-background">
      {/* LEFT AREA: Catalog, Search & Categories (Takes majority width) */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* POS Header Bar */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5 gap-3">
          {/* Branch Context Selector */}
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-4" />
            </div>

            {canSwitchBranch && branches.length > 1 ? (
              <select
                value={selectedBranchId}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.branchCode})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-foreground">
                {branches.find((b) => b.id === selectedBranchId)?.name || "Branch"}
              </span>
            )}
          </div>

          {/* Order Type Toggle: Dine-In vs Takeaway */}
          <div className="flex items-center rounded-xl border border-border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setOrderType("dine-in")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all",
                orderType === "dine-in"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Utensils className="size-3.5" />
              Dine-In
            </button>

            <button
              type="button"
              onClick={() => setOrderType("take-away")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all",
                orderType === "take-away"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ShoppingBag className="size-3.5" />
              Takeaway
            </button>
          </div>

          {/* Table Selector (if Dine-In) */}
          {orderType === "dine-in" && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Table:</span>
              <select
                value={selectedTableId || ""}
                onChange={(e) => setSelectedTableId(e.target.value || null)}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {tables.map((table) => (
                  <option
                    key={table.id}
                    value={table.id}
                    disabled={table.status === "inactive"}
                  >
                    {table.tableName} ({table.tableNumber}) • {table.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Actions: Clock, History, Fullscreen */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg">
              <Clock className="size-3.5" />
              <span>{currentTime}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistoryModal(true)}
              className="h-8 text-xs font-bold rounded-lg flex items-center gap-1"
            >
              <History className="size-3.5" />
              Bills
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCashDrawer}
              className="h-8 text-xs font-bold rounded-lg flex items-center gap-1 text-muted-foreground hover:text-foreground"
              title="Kick Cash Drawer"
            >
              <Wallet className="size-3.5 text-amber-500" />
              Drawer
            </Button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
          </div>
        </div>

        {/* Categories Bar & Quick Search */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2 gap-3">
          {/* Categories Horizontal Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
            {catalog.categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors shrink-0",
                  selectedCategoryId === cat.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-56 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search items…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/20 pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground">
              <p className="text-sm font-semibold">No menu items found</p>
              <p className="text-xs mt-1">Try another category or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredItems.map((item) => {
                const hasCustomizations =
                  item.customizationGroups && item.customizationGroups.length > 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddItemClick(item)}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-3 text-left shadow-sm hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    {/* Item Top: Image or Veg/Non-veg icon */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="flex size-4 items-center justify-center rounded border border-border/80">
                        <CircleDot
                          className={cn(
                            "size-2.5",
                            item.isVeg ? "text-emerald-600" : "text-amber-700"
                          )}
                        />
                      </div>

                      {hasCustomizations && (
                        <span className="rounded bg-accent/60 px-1.5 py-0.2 text-[9px] font-bold text-accent-foreground">
                          Options
                        </span>
                      )}
                    </div>

                    {/* Item Name & Category */}
                    <div className="mb-3">
                      <p className="font-bold text-xs leading-snug text-foreground line-clamp-2">
                        {item.name}
                      </p>
                      {item.categoryName && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {item.categoryName}
                        </p>
                      )}
                    </div>

                    {/* Price & Add Indicator */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-xs font-extrabold text-foreground font-mono">
                        {formatBillingMoney(item.price)}
                      </span>
                      <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Plus className="size-3.5 stroke-3" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: POS Cart (Fixed width 360px - 400px) */}
      <div className="w-80 md:w-96 shrink-0 h-full">
        <PosCart
          items={cartItems}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          onRemove={handleRemove}
          onClear={handleClearCart}
          onCheckout={() => setShowCheckoutModal(true)}
          discountType={discountType}
          discountValue={discountValue}
          onSetDiscount={(t, v) => {
            setDiscountType(t);
            setDiscountValue(v);
          }}
          taxRate={taxRate}
        />
      </div>

      {/* Item Customizer Modal */}
      <PosItemCustomizerModal
        item={customizingItem}
        isOpen={Boolean(customizingItem)}
        onClose={() => setCustomizingItem(null)}
        onConfirm={({ item, quantity, notes, customizations, calculatedUnitPrice }) => {
          addItemToCart(item, quantity, notes, customizations, calculatedUnitPrice);
        }}
      />

      {/* Checkout Modal */}
      <PosCheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        branchId={selectedBranchId}
        tableId={orderType === "dine-in" ? selectedTableId : null}
        orderType={orderType}
        items={cartItems}
        subtotal={subtotal}
        discountType={discountType}
        discountValue={discountValue}
        discountAmount={discountAmount}
        gstBreakdown={gstBreakdown}
        grandTotal={grandTotal}
        onOrderCompleted={handleOrderCompleted}
      />

      {/* Invoice Modal (Print / Reprint) */}
      <PosInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onNewOrder={handleNewOrder}
        checkoutResult={checkoutResult}
        billId={reprintBill?.id}
        branchId={selectedBranchId}
        isReprint={Boolean(reprintBill)}
      />

      {/* Billing History / Reprint Modal */}
      <PosBillingHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelectReprint={handleOpenReprint}
      />
    </div>
  );
}
