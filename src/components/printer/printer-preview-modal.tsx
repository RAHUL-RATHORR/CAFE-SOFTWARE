"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Printer, FileText, X } from "lucide-react";
import type { ThermalPaperWidth } from "@/types/printer";

interface PrinterPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewText: string;
  printerName?: string;
  paperWidth?: ThermalPaperWidth;
  title?: string;
}

export function PrinterPreviewModal({
  open,
  onOpenChange,
  previewText,
  printerName = "Thermal Printer",
  paperWidth = "80mm",
  title = "Thermal Receipt Preview",
}: PrinterPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const is58mm = paperWidth === "58mm";
  const rollWidthClass = is58mm ? "max-w-[280px]" : "max-w-[380px]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/25">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{title}</h2>
              <p className="text-xs text-muted-foreground">
                Simulating {paperWidth} thermal roll output ({printerName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs rounded-xl"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Text"}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-8 gap-1.5 text-xs rounded-xl bg-primary text-primary-foreground"
              onClick={handlePrint}
            >
              <Printer className="w-3.5 h-3.5" />
              Browser Print
            </Button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Receipt Simulation Viewport */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/60 flex justify-center items-start">
          <div
            id="thermal-receipt-printable"
            className={`w-full ${rollWidthClass} bg-white text-black font-mono text-[11px] p-5 shadow-2xl rounded-sm border-t-4 border-slate-300 relative selection:bg-slate-200`}
            style={{
              fontFamily: '"Courier New", Courier, monospace',
              letterSpacing: "-0.2px",
              lineHeight: "15px",
            }}
          >
            {/* Top jagged tear visual effect */}
            <div
              className="absolute top-0 left-0 right-0 h-1 -mt-1"
              style={{
                backgroundImage:
                  "radial-gradient(circle at bottom, #ffffff 3px, transparent 4px)",
                backgroundSize: "8px 4px",
              }}
            />

            <pre className="whitespace-pre-wrap break-all select-all font-mono font-medium">
              {previewText || "No receipt content generated."}
            </pre>

            {/* Bottom serrated tear visual effect */}
            <div className="mt-4 pt-3 border-t border-dashed border-neutral-300 text-center text-[9px] text-neutral-400">
              [--- TEAR HERE ---]
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-border bg-muted/20 px-6 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs h-8"
          >
            Close Preview
          </Button>
        </div>
      </div>

      {/* Print-specific stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-receipt-printable,
          #thermal-receipt-printable * {
            visibility: visible;
          }
          #thermal-receipt-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: ${is58mm ? "58mm" : "80mm"};
            margin: 0;
            padding: 4mm;
            box-shadow: none;
            border: none;
          }
        }
      `}</style>
    </div>
  );
}
