"use client";

import React, { useState } from "react";
import {
  Printer as PrinterIcon,
  Plus,
  Wifi,
  Usb,
  Bluetooth,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Eye,
  Trash2,
  Edit2,
  Star,
  Layers,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPrinterAction,
  updatePrinterAction,
  deletePrinterAction,
  setDefaultPrinterAction,
  testPrinterAction,
} from "@/actions/printer";
import { PrinterPreviewModal } from "./printer-preview-modal";
import { formatTestReceipt } from "@/lib/printer/receipt-formatter";
import type {
  PrinterConfig,
  CreatePrinterInput,
  ThermalPaperWidth,
  PrinterConnectionType,
  PrinterRole,
} from "@/types/printer";

interface BranchOption {
  id: string;
  name: string;
}

interface PrinterSettingsShellProps {
  initialPrinters: PrinterConfig[];
  branches: BranchOption[];
}

export function PrinterSettingsShell({
  initialPrinters,
  branches,
}: PrinterSettingsShellProps) {
  const [printers, setPrinters] = useState<PrinterConfig[]>(initialPrinters);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterConfig | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState(branches[0]?.id || "");
  const [type, setType] = useState<PrinterRole>("receipt");
  const [connectionType, setConnectionType] = useState<PrinterConnectionType>("network");
  const [address, setAddress] = useState("192.168.1.200");
  const [port, setPort] = useState(9100);
  const [paperWidth, setPaperWidth] = useState<ThermalPaperWidth>("80mm");
  const [characterWidth, setCharacterWidth] = useState(48);
  const [autoCut, setAutoCut] = useState(true);
  const [openCashDrawer, setOpenCashDrawer] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [footerText, setFooterText] = useState(
    "Thank you for dining with us! Please visit again."
  );

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Monospace Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({
    text: "",
    printerName: "",
    paperWidth: "80mm" as ThermalPaperWidth,
  });

  // Filtered printers
  const filteredPrinters =
    selectedBranchId === "all"
      ? printers
      : printers.filter((p) => p.branchId === selectedBranchId);

  const resetForm = () => {
    setEditingPrinter(null);
    setName("");
    setBranchId(branches[0]?.id || "");
    setType("receipt");
    setConnectionType("network");
    setAddress("192.168.1.200");
    setPort(9100);
    setPaperWidth("80mm");
    setCharacterWidth(48);
    setAutoCut(true);
    setOpenCashDrawer(false);
    setAutoPrint(false);
    setIsDefault(false);
    setIsActive(true);
    setFooterText("Thank you for dining with us! Please visit again.");
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (p: PrinterConfig) => {
    setEditingPrinter(p);
    setName(p.name);
    setBranchId(p.branchId);
    setType(p.type);
    setConnectionType(p.connectionType);
    setAddress(p.address);
    setPort(p.port);
    setPaperWidth(p.paperWidth);
    setCharacterWidth(p.characterWidth);
    setAutoCut(p.autoCut);
    setOpenCashDrawer(p.openCashDrawer);
    setAutoPrint(p.autoPrint);
    setIsDefault(p.isDefault);
    setIsActive(p.isActive);
    setFooterText(p.footerText);
    setModalOpen(true);
  };

  const handlePaperWidthChange = (val: ThermalPaperWidth) => {
    setPaperWidth(val);
    if (val === "58mm") {
      setCharacterWidth(32);
    } else {
      setCharacterWidth(48);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setActionFeedback({ type: "error", message: "Printer name is required." });
      return;
    }
    if (!branchId) {
      setActionFeedback({ type: "error", message: "Branch selection is required." });
      return;
    }
    if (!address.trim()) {
      setActionFeedback({ type: "error", message: "Printer IP address or bridge URL is required." });
      return;
    }

    setIsSaving(true);
    setActionFeedback(null);

    try {
      if (editingPrinter) {
        const res = await updatePrinterAction(editingPrinter.id, {
          branchId,
          name,
          type,
          connectionType,
          address,
          port,
          paperWidth,
          characterWidth,
          autoCut,
          openCashDrawer,
          autoPrint,
          isDefault,
          isActive,
          footerText,
        });

        if (res.success && res.data) {
          const updated = res.data;
          setPrinters((prev) =>
            prev.map((p) => {
              if (p.id === updated.id) return updated;
              if (updated.isDefault && p.branchId === updated.branchId) {
                return { ...p, isDefault: false };
              }
              return p;
            })
          );
          setModalOpen(false);
          setActionFeedback({
            type: "success",
            message: `Printer "${updated.name}" updated successfully.`,
          });
        } else {
          setActionFeedback({
            type: "error",
            message: res.error || "Failed to update printer.",
          });
        }
      } else {
        const input: CreatePrinterInput = {
          branchId,
          name,
          type,
          connectionType,
          address,
          port,
          paperWidth,
          characterWidth,
          autoCut,
          openCashDrawer,
          autoPrint,
          isDefault,
          isActive,
          footerText,
        };

        const res = await createPrinterAction(input);
        if (res.success && res.data) {
          const created = res.data;
          setPrinters((prev) => {
            const next = prev.map((p) =>
              created.isDefault && p.branchId === created.branchId
                ? { ...p, isDefault: false }
                : p
            );
            return [created, ...next];
          });
          setModalOpen(false);
          setActionFeedback({
            type: "success",
            message: `Printer "${created.name}" configured successfully.`,
          });
        } else {
          setActionFeedback({
            type: "error",
            message: res.error || "Failed to create printer.",
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPrint = async (p: PrinterConfig) => {
    setTestingId(p.id);
    setActionFeedback(null);
    try {
      const res = await testPrinterAction(p.id);
      if (res.success && res.data) {
        const result = res.data;
        setPrinters((prev) =>
          prev.map((item) =>
            item.id === p.id
              ? {
                  ...item,
                  status: result.status === "PRINTED" ? "connected" : "error",
                }
              : item
          )
        );

        if (result.status === "PRINTED") {
          setActionFeedback({
            type: "success",
            message: `Test print dispatched to ${p.name} via ${result.transport}. Check printer!`,
          });
        } else {
          setActionFeedback({
            type: "info",
            message: `Hardware did not respond (${result.error || "Offline"}). Browser thermal preview ready.`,
          });
          // Show preview
          setPreviewContent({
            text: result.previewText,
            printerName: p.name,
            paperWidth: p.paperWidth,
          });
          setPreviewModalOpen(true);
        }
      } else {
        setActionFeedback({
          type: "error",
          message: res.error || "Test print execution error.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Test print failed";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setTestingId(null);
    }
  };

  const handleOpenPreview = (p: PrinterConfig) => {
    const builder = formatTestReceipt(p);
    setPreviewContent({
      text: builder.toPreviewText(),
      printerName: p.name,
      paperWidth: p.paperWidth,
    });
    setPreviewModalOpen(true);
  };

  const handleSetDefault = async (p: PrinterConfig) => {
    try {
      const res = await setDefaultPrinterAction(p.id);
      if (res.success && res.data) {
        setPrinters((prev) =>
          prev.map((item) => ({
            ...item,
            isDefault: item.id === p.id,
          }))
        );
        setActionFeedback({
          type: "success",
          message: `"${p.name}" is now the default printer for this branch.`,
        });
      } else {
        setActionFeedback({
          type: "error",
          message: res.error || "Failed to set default printer.",
        });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Failed to set default printer." });
    }
  };

  const handleDelete = async (p: PrinterConfig) => {
    if (!confirm(`Are you sure you want to delete printer "${p.name}"?`)) return;
    try {
      const res = await deletePrinterAction(p.id);
      if (res.success) {
        setPrinters((prev) => prev.filter((item) => item.id !== p.id));
        setActionFeedback({
          type: "success",
          message: `Printer "${p.name}" deleted.`,
        });
      } else {
        setActionFeedback({
          type: "error",
          message: res.error || "Failed to delete printer.",
        });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Failed to delete printer." });
    }
  };

  const getStatusBadge = (status: PrinterConfig["status"]) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> Connected
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/30 gap-1 font-medium">
            <XCircle className="w-3 h-3" /> Unreachable
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1 font-medium">
            <HelpCircle className="w-3 h-3" /> Untested
          </Badge>
        );
    }
  };

  const getConnectionIcon = (conn: PrinterConnectionType) => {
    switch (conn) {
      case "network":
        return <Wifi className="w-4 h-4 text-blue-500" />;
      case "usb":
        return <Usb className="w-4 h-4 text-amber-500" />;
      case "bluetooth":
        return <Bluetooth className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <PrinterIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              ESC/POS Hardware Thermal Printers
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure network TCP (port 9100) or USB bridge printers for POS billing receipts and cash drawer kick.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedBranchId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <Button onClick={openCreateModal} size="sm" className="gap-1.5 h-9 text-xs rounded-xl">
            <Plus className="w-4 h-4" /> Add Printer
          </Button>
        </div>
      </div>

      {/* Feedback banner */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
            actionFeedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : actionFeedback.type === "error"
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Printer List */}
      {filteredPrinters.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-3 text-muted-foreground">
              <PrinterIcon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold">No Thermal Printers Configured</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Add your restaurant&apos;s network receipt printer (Epson, TVS, Star, Xprinter) to enable automatic thermal receipt printing on POS checkout.
            </p>
            <Button onClick={openCreateModal} size="sm" className="gap-1.5 text-xs rounded-xl">
              <Plus className="w-4 h-4" /> Configure First Printer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrinters.map((p) => {
            const branchName = branches.find((b) => b.id === p.branchId)?.name || "Main Branch";
            const isTesting = testingId === p.id;

            return (
              <Card
                key={p.id}
                className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                  p.isDefault ? "border-primary/50 shadow-xs" : "border-border"
                } ${!p.isActive ? "opacity-60" : ""}`}
              >
                {p.isDefault && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-bl-md flex items-center gap-1 shadow-xs">
                    <Star className="w-3 h-3 fill-current" /> Default Receipt
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between pr-14">
                    <div>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        {p.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5 flex items-center gap-1">
                        <Layers className="w-3 h-3" /> {branchName} • {p.type.toUpperCase()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  {/* Hardware Details Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Interface
                      </span>
                      <div className="flex items-center gap-1 font-medium capitalize mt-0.5">
                        {getConnectionIcon(p.connectionType)}
                        {p.connectionType}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Paper Width
                      </span>
                      <span className="font-semibold text-foreground mt-0.5 block">
                        {p.paperWidth} ({p.characterWidth} col)
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-border/30">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Target Address
                      </span>
                      <span className="font-mono text-[11px] truncate block text-foreground">
                        {p.address}:{p.port}
                      </span>
                    </div>
                  </div>

                  {/* Feature Badges */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {getStatusBadge(p.status)}
                    {p.autoCut && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        Auto-Cut
                      </Badge>
                    )}
                    {p.openCashDrawer && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        Drawer Kick
                      </Badge>
                    )}
                    {p.autoPrint && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        Auto-Print
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-border flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 rounded-lg"
                        disabled={isTesting}
                        onClick={() => handleTestPrint(p)}
                      >
                        <RefreshCw className={`w-3 h-3 ${isTesting ? "animate-spin" : ""}`} />
                        {isTesting ? "Testing..." : "Test Print"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs px-2 rounded-lg"
                        title="View Receipt Preview"
                        onClick={() => handleOpenPreview(p)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      {!p.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs px-2 text-muted-foreground hover:text-foreground rounded-lg"
                          title="Set as branch default"
                          onClick={() => handleSetDefault(p)}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs px-2 rounded-lg"
                        title="Edit configuration"
                        onClick={() => openEditModal(p)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs px-2 text-destructive hover:text-destructive rounded-lg"
                        title="Delete printer"
                        onClick={() => handleDelete(p)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Hardware Architecture Info Card */}
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            Thermal Printing Architecture & Decoupling
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            • <strong>Network Thermal Printers (LAN / Wi-Fi):</strong> Connect directly via raw TCP socket on Port 9100. Provide the printer&apos;s static IP address.
          </p>
          <p>
            • <strong>USB Thermal Printers:</strong> Connect through a lightweight local print bridge daemon (e.g. <code>127.0.0.1:9095/print</code>) that relays ESC/POS commands to raw USB endpoints.
          </p>
          <p>
            • <strong>Financial Decoupling:</strong> If the printer is out of paper, offline, or disconnected, your POS orders and customer payments remain 100% saved and intact. Cashiers can instantly reprint or view the browser preview with zero loss of data.
          </p>
        </CardContent>
      </Card>

      {/* Create / Edit Printer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
              <h3 className="text-base font-bold text-foreground">
                {editingPrinter ? `Edit ${editingPrinter.name}` : "Configure ESC/POS Thermal Printer"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Name & Branch */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="printer-name" className="text-xs font-semibold">
                    Printer Name *
                  </Label>
                  <Input
                    id="printer-name"
                    placeholder="e.g. Counter Thermal Receipt"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    className="h-8 text-xs rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Branch *</Label>
                  <select
                    value={branchId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBranchId(e.target.value)}
                    className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role & Connection Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Printer Role</Label>
                  <select
                    value={type}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as PrinterRole)}
                    className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="receipt">Receipt (Counter)</option>
                    <option value="kitchen">Kitchen (KOT)</option>
                    <option value="billing">Billing Station</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Connection Interface</Label>
                  <select
                    value={connectionType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setConnectionType(e.target.value as PrinterConnectionType)
                    }
                    className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="network">Network TCP (Ethernet / Wi-Fi)</option>
                    <option value="usb">USB (Local Bridge Daemon)</option>
                    <option value="bluetooth">Bluetooth (Direct)</option>
                  </select>
                </div>
              </div>

              {/* Address & Port */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="printer-addr" className="text-xs font-semibold">
                    {connectionType === "network" ? "Printer IP Address *" : "Bridge URL / Device *"}
                  </Label>
                  <Input
                    id="printer-addr"
                    placeholder={connectionType === "network" ? "192.168.1.200" : "127.0.0.1:9095/print"}
                    value={address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
                    className="h-8 text-xs font-mono rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="printer-port" className="text-xs font-semibold">
                    Raw Port
                  </Label>
                  <Input
                    id="printer-port"
                    type="number"
                    placeholder="9100"
                    value={port}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPort(Number(e.target.value) || 9100)}
                    className="h-8 text-xs font-mono rounded-lg"
                    disabled={connectionType !== "network"}
                  />
                </div>
              </div>

              {/* Paper Width & Character Width */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Thermal Paper Width</Label>
                  <select
                    value={paperWidth}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      handlePaperWidthChange(e.target.value as ThermalPaperWidth)
                    }
                    className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="80mm">80mm (Standard Full Width)</option>
                    <option value="58mm">58mm (Compact Mobile Roll)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="char-width" className="text-xs font-semibold">
                    Chars per Line
                  </Label>
                  <Input
                    id="char-width"
                    type="number"
                    value={characterWidth}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCharacterWidth(Number(e.target.value) || 48)
                    }
                    className="h-8 text-xs font-mono rounded-lg"
                  />
                </div>
              </div>

              {/* Hardware Toggles */}
              <div className="space-y-3 pt-2 border-t border-border">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-medium text-foreground block">Auto-Cut Paper</span>
                    <span className="text-[11px] text-muted-foreground">
                      Send ESC/POS cut command (GS V 66 0) at receipt end.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoCut}
                    onChange={(e) => setAutoCut(e.target.checked)}
                    className="rounded text-primary focus:ring-primary size-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-medium text-foreground block">Kick Cash Drawer</span>
                    <span className="text-[11px] text-muted-foreground">
                      Send 50ms RJ11 pulse to trigger connected cash drawer.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={openCashDrawer}
                    onChange={(e) => setOpenCashDrawer(e.target.checked)}
                    className="rounded text-primary focus:ring-primary size-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-medium text-foreground block">Auto-Print on Checkout</span>
                    <span className="text-[11px] text-muted-foreground">
                      Automatically fire thermal receipt when POS bill is paid.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPrint}
                    onChange={(e) => setAutoPrint(e.target.checked)}
                    className="rounded text-primary focus:ring-primary size-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-medium text-foreground block">Default Printer for Branch</span>
                    <span className="text-[11px] text-muted-foreground">
                      Primary receipt printer for customers in this branch.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded text-primary focus:ring-primary size-4"
                  />
                </label>
              </div>

              {/* Receipt Footer */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <Label htmlFor="footer-text" className="text-xs font-semibold">
                  Custom Receipt Footer
                </Label>
                <textarea
                  id="footer-text"
                  rows={2}
                  value={footerText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFooterText(e.target.value)}
                  placeholder="Thank you for dining with us! Please visit again."
                  className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-6 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                disabled={isSaving}
                className="text-xs h-8 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs h-8 rounded-lg bg-primary text-primary-foreground"
              >
                {isSaving ? "Saving..." : editingPrinter ? "Update Printer" : "Save Printer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Monospace Thermal Receipt Preview Modal */}
      <PrinterPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        previewText={previewContent.text}
        printerName={previewContent.printerName}
        paperWidth={previewContent.paperWidth}
      />
    </div>
  );
}
