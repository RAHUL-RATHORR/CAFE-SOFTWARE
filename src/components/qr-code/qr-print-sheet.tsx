"use client";

import { useEffect } from "react";
import {
  BaseModal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/modals/base-modal";
import { Button } from "@/components/ui/button";
import { QrCodeCanvas } from "@/components/qr-code/qr-code-canvas";

export type QrPrintItem = {
  tableNumber: string;
  tableName: string;
  url: string;
};

type QrPrintSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchName: string;
  items: QrPrintItem[];
};

export function QrPrintSheet({
  open,
  onOpenChange,
  branchName,
  items,
}: QrPrintSheetProps) {
  useEffect(() => {
    if (!open) return;
    const styleId = "dineflow-qr-print-style";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #qr-print-root, #qr-print-root * { visibility: visible !important; }
        #qr-print-root {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          padding: 16px;
        }
        .no-print { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }, [open]);

  function handlePrint() {
    window.print();
  }

  return (
    <BaseModal open={open} onOpenChange={onOpenChange} size="xl">
      <div className="no-print">
        <ModalHeader>
          <h2 className="text-base font-semibold">QR sheet · {branchName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Print-ready sheet. Use your browser print dialog to save as PDF if
            needed.
          </p>
        </ModalHeader>
      </div>
      <ModalBody>
        <div id="qr-print-root" className="space-y-4">
          <div className="mb-4 hidden print:block">
            <h1 className="text-xl font-semibold">
              {branchName} — Table QR codes
            </h1>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={`${item.tableNumber}-${item.url}`}
                className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-center"
              >
                <QrCodeCanvas value={item.url} size={160} />
                <div className="font-semibold">{item.tableName}</div>
                <div className="font-mono text-xs">{item.tableNumber}</div>
              </div>
            ))}
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active QR codes to print.
            </p>
          ) : null}
        </div>
      </ModalBody>
      <ModalFooter className="no-print">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => onOpenChange(false)}
        >
          Close
        </Button>
        <Button
          type="button"
          className="rounded-xl"
          disabled={items.length === 0}
          onClick={handlePrint}
        >
          Print
        </Button>
      </ModalFooter>
    </BaseModal>
  );
}
