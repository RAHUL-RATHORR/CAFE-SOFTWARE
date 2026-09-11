"use client";

import type { InvoicePrintData } from "@/types/billing";
import { formatBillingMoney } from "@/lib/billing";

type PosReceiptPrintProps = {
  data: InvoicePrintData | null;
};

export function PosReceiptPrint({ data }: PosReceiptPrintProps) {
  if (!data) return null;

  return (
    <div
      id="pos-thermal-receipt"
      className="hidden print:block print:w-full print:max-w-[80mm] print:mx-auto print:p-2 print:text-black print:bg-white text-xs font-mono leading-tight"
    >
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #pos-thermal-receipt,
          #pos-thermal-receipt * {
            visibility: visible;
          }
          #pos-thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 80mm;
            margin: 0 auto;
            padding: 4mm;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="text-center border-b border-dashed border-black pb-2 mb-2">
        <h1 className="text-sm font-bold uppercase tracking-wider">
          {data.restaurantName}
        </h1>
        {data.legalName && data.legalName !== data.restaurantName && (
          <p className="text-[10px] text-gray-700">({data.legalName})</p>
        )}
        <p className="text-[11px] mt-0.5">{data.branchName}</p>
        {data.branchAddress && (
          <p className="text-[10px] text-gray-700">{data.branchAddress}</p>
        )}
        {data.phone && <p className="text-[10px]">Tel: {data.phone}</p>}
        {data.gstin && (
          <p className="text-[10px] font-bold mt-0.5">GSTIN: {data.gstin}</p>
        )}
      </div>

      {/* Bill Meta */}
      <div className="border-b border-dashed border-black pb-1.5 mb-1.5 text-[11px]">
        <div className="flex justify-between">
          <span>Inv: {data.invoiceNumber}</span>
          <span>{new Date(data.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex justify-between">
          <span>Date: {new Date(data.issuedAt).toLocaleDateString()}</span>
          <span className="capitalize">{data.orderType}</span>
        </div>
        {data.orderNumber && (
          <div className="flex justify-between">
            <span>Order #: {data.orderNumber}</span>
            {data.tableLabel && <span className="font-bold">{data.tableLabel}</span>}
          </div>
        )}
        {data.customerLabel && (
          <div className="flex justify-between">
            <span>Guest: {data.customerLabel}</span>
          </div>
        )}
        {data.cashierName && (
          <div className="flex justify-between text-[10px] text-gray-700">
            <span>Cashier: {data.cashierName}</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="border-b border-dashed border-black pb-1.5 mb-1.5">
        <div className="flex justify-between font-bold text-[11px] border-b border-black pb-0.5 mb-1">
          <span className="w-1/2">Item</span>
          <span className="w-12 text-center">Qty</span>
          <span className="w-14 text-right">Rate</span>
          <span className="w-16 text-right">Amt</span>
        </div>

        {data.items.map((item, index) => (
          <div key={index} className="mb-1 text-[11px]">
            <div className="flex justify-between">
              <span className="w-1/2 font-semibold truncate">{item.name}</span>
              <span className="w-12 text-center">{item.quantity}</span>
              <span className="w-14 text-right">{item.rate.toFixed(2)}</span>
              <span className="w-16 text-right font-semibold">
                {item.amount.toFixed(2)}
              </span>
            </div>
            {item.customizations && item.customizations.length > 0 && (
              <p className="text-[9px] text-gray-600 pl-1">
                {item.customizations.join(", ")}
              </p>
            )}
            {item.notes && (
              <p className="text-[9px] italic text-gray-600 pl-1">
                Note: {item.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Totals & Tax Breakdown */}
      <div className="border-b border-dashed border-black pb-1.5 mb-1.5 text-[11px] space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatBillingMoney(data.subtotal)}</span>
        </div>

        {data.discount > 0 && (
          <div className="flex justify-between text-gray-800">
            <span>Discount ({data.discountLabel}):</span>
            <span>-{formatBillingMoney(data.discount)}</span>
          </div>
        )}

        <div className="flex justify-between font-medium">
          <span>Taxable Value:</span>
          <span>{formatBillingMoney(data.taxableAmount)}</span>
        </div>

        {data.gstBreakdown.cgstAmount > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>CGST ({data.gstBreakdown.cgstRate}%):</span>
            <span>{formatBillingMoney(data.gstBreakdown.cgstAmount)}</span>
          </div>
        )}

        {data.gstBreakdown.sgstAmount > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>SGST ({data.gstBreakdown.sgstRate}%):</span>
            <span>{formatBillingMoney(data.gstBreakdown.sgstAmount)}</span>
          </div>
        )}

        {data.gstBreakdown.igstAmount > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>IGST ({data.gstBreakdown.igstRate}%):</span>
            <span>{formatBillingMoney(data.gstBreakdown.igstAmount)}</span>
          </div>
        )}

        {data.serviceCharge > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>Service Charge:</span>
            <span>{formatBillingMoney(data.serviceCharge)}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
          <span>GRAND TOTAL:</span>
          <span>{formatBillingMoney(data.grandTotal)}</span>
        </div>
      </div>

      {/* Payment Information */}
      <div className="border-b border-dashed border-black pb-1.5 mb-1.5 text-[11px] space-y-0.5">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="font-bold uppercase">{data.paymentStatus}</span>
        </div>

        {data.payments.map((p, i) => (
          <div key={i} className="flex justify-between text-[10px]">
            <span className="uppercase">{p.method}{p.reference ? ` (${p.reference})` : ''}:</span>
            <span>{formatBillingMoney(p.amount)}</span>
          </div>
        ))}

        {data.changeGiven > 0 && (
          <div className="flex justify-between font-semibold text-emerald-800">
            <span>Change Returned:</span>
            <span>{formatBillingMoney(data.changeGiven)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-1 text-[10px]">
        <p className="font-medium">{data.footerNote || "Thank you for dining with us!"}</p>
        <p className="text-[9px] text-gray-600 mt-0.5">Powered by DineFlow POS</p>
      </div>
    </div>
  );
}
