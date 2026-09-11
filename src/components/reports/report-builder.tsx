"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, FileSpreadsheet, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ReportType = "sales-summary" | "sales-detail" | "payments" | "gst" | "inventory" | "menu-performance" | "daily-closing";

interface ReportBuilderProps {
  branches: { id: string; name: string }[];
}

export function ReportBuilder({ branches }: ReportBuilderProps) {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<ReportType>("sales-summary");
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [branchId, setBranchId] = useState<string>("all");
  
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState<"pdf" | "excel" | "csv" | null>(null);

  const fetchPreview = async () => {
    try {
      setIsLoading(true);
      const query = new URLSearchParams({
        reportType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        ...(branchId !== "all" && { branchId }),
        limit: "10"
      });

      const res = await fetch(`/api/admin/reports/preview?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch preview");
      const result = await res.json();
      setPreviewData(result.data || []);
    } catch (error: any) {
      toast({
        title: "Preview Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    try {
      setIsExporting(format);
      const query = new URLSearchParams({
        reportType,
        format,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        ...(branchId !== "all" && { branchId }),
      });

      const res = await fetch(`/api/admin/reports/export?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to export report");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const extension = format === "excel" ? "xlsx" : format;
      
      a.download = `Report_${reportType}_${startDate}_to_${endDate}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/20">
        <div className="space-y-2">
          <Label>Report Type</Label>
          <Select value={reportType} onValueChange={(v: any) => v && setReportType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales-summary">Sales Summary</SelectItem>
              <SelectItem value="sales-detail">Sales Details</SelectItem>
              <SelectItem value="payments">Payment Report</SelectItem>
              <SelectItem value="gst">GST / Tax Report</SelectItem>
              <SelectItem value="inventory">Inventory Movements</SelectItem>
              <SelectItem value="menu-performance">Menu Performance</SelectItem>
              <SelectItem value="daily-closing">Daily Closing Report</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Branch</Label>
          <Select value={branchId} onValueChange={(v: any) => v && setBranchId(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={fetchPreview} disabled={isLoading}>
          {isLoading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
          Preview
        </Button>
        <div className="flex-1" />
        <Button variant="outline" onClick={() => handleExport("pdf")} disabled={isExporting !== null}>
          <FileText className="mr-2 h-4 w-4 text-red-500" />
          {isExporting === "pdf" ? "Exporting..." : "PDF"}
        </Button>
        <Button variant="outline" onClick={() => handleExport("excel")} disabled={isExporting !== null}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          {isExporting === "excel" ? "Exporting..." : "Excel"}
        </Button>
        <Button variant="outline" onClick={() => handleExport("csv")} disabled={isExporting !== null}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting === "csv" ? "Exporting..." : "CSV"}
        </Button>
      </div>

      {previewData && previewData.length > 0 && (
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                {Object.keys(previewData[0]).map(key => (
                  <th key={key} className="px-4 py-3">{key.replace(/([A-Z])/g, ' $1').trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
                  {Object.values(row).map((val: any, j) => (
                    <td key={j} className="px-4 py-2">
                      {val === null || val === undefined ? "-" : String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2 text-xs text-muted-foreground text-center bg-muted/20">
            Showing top {previewData.length} rows preview. Export for full dataset.
          </div>
        </div>
      )}

      {previewData && previewData.length === 0 && (
        <div className="p-8 text-center border rounded-md text-muted-foreground">
          No data available for the selected filters.
        </div>
      )}
    </div>
  );
}
