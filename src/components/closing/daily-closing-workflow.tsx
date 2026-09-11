"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "@/store";

interface DailyClosingWorkflowProps {
  branchId: string;
}

export function DailyClosingWorkflow({ branchId }: DailyClosingWorkflowProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [cashActual, setCashActual] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const businessDate = new Date().toISOString().split("T")[0]; // Use today's date locally

  useEffect(() => {
    fetchStats();
  }, [branchId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        branchId,
        businessDate,
      });
      const res = await fetch(`/api/admin/daily-closing?${query.toString()}`).then(r => r.json());
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Failed to load daily closing stats", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDay = async () => {
    if (!cashActual) {
      toast.error("Error", "Please enter actual cash amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/daily-closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          businessDate,
          cashActual: Number(cashActual),
        })
      }).then(r => r.json());

      if (res.success) {
        toast.success("Success", "Business day closed successfully");
        setIsClosed(true);
      } else {
        toast.error("Error", res.error || "Failed to close day");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", "Failed to close day");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isClosed) {
    return (
      <Card className="max-w-2xl mx-auto border-emerald-500 bg-emerald-50/50">
        <CardContent className="flex flex-col items-center p-12 text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-emerald-500" />
          <h2 className="text-2xl font-bold text-emerald-700">Day Closed Successfully</h2>
          <p className="text-muted-foreground">The business day {businessDate} has been successfully closed.</p>
        </CardContent>
      </Card>
    );
  }

  const expected = stats?.cashExpected || 0;
  const actual = Number(cashActual) || 0;
  const diff = actual - expected;

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Sales Summary</CardTitle>
          <CardDescription>Overview of today&apos;s sales and orders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Total Orders</span>
            <span className="font-medium">{stats?.totalOrders || 0}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Gross Sales</span>
            <span className="font-medium">₹{stats?.grossSales?.toLocaleString() || 0}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Discounts</span>
            <span className="font-medium">₹{stats?.discounts?.toLocaleString() || 0}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">₹{stats?.tax?.toLocaleString() || 0}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="font-semibold">Net Sales</span>
            <span className="font-bold text-lg">₹{stats?.netSales?.toLocaleString() || 0}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
             <div className="flex justify-between">
              <span className="text-muted-foreground">Expected Cash</span>
              <span className="font-medium">₹{expected.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">UPI Amount</span>
              <span className="font-medium">₹{stats?.upiAmount?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Card Amount</span>
              <span className="font-medium">₹{stats?.cardAmount?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Refunds</span>
              <span className="font-medium text-destructive">₹{stats?.refundAmount?.toLocaleString() || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary shadow-md">
          <CardHeader>
            <CardTitle>Cash Reconciliation</CardTitle>
            <CardDescription>Enter the actual cash counted in the drawer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cashActual">Actual Cash Counted (₹)</Label>
              <Input 
                id="cashActual" 
                type="number" 
                min="0"
                value={cashActual} 
                onChange={(e) => setCashActual(e.target.value)} 
                placeholder="0"
                className="text-lg"
              />
            </div>
            
            {cashActual !== "" && (
              <div className={`p-4 rounded-md flex items-center justify-between ${diff === 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : diff > 0 ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
                <div className="flex items-center gap-2">
                  {diff !== 0 && <AlertTriangle className="w-5 h-5" />}
                  <span className="font-semibold">
                    {diff === 0 ? "BALANCED" : diff > 0 ? "OVERAGE" : "SHORTAGE"}
                  </span>
                </div>
                <span className="font-bold">₹{Math.abs(diff).toLocaleString()}</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleCloseDay}
              disabled={isSubmitting || cashActual === ""}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Daily Closing
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
