"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, DollarSign, ShoppingBag, CreditCard } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Button } from "@/components/ui/button";

interface AnalyticsDashboardProps {
  branchId?: string;
}

export function AnalyticsDashboard({ branchId }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState("today");

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a28CFE'];

  useEffect(() => {
    fetchData();
  }, [dateRange, branchId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      
      if (dateRange === "yesterday") {
        start.setDate(now.getDate() - 1);
        now.setDate(now.getDate() - 1);
        now.setHours(23, 59, 59, 999);
      } else if (dateRange === "last7") {
        start.setDate(now.getDate() - 7);
      } else if (dateRange === "last30") {
        start.setDate(now.getDate() - 30);
      }

      const query = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: now.toISOString(),
      });
      if (branchId) query.append("branchId", branchId);

      const [resOverview, resTrend, resPayments, resItems] = await Promise.all([
        fetch(`/api/admin/analytics?type=overview&${query.toString()}`).then(r => r.json()),
        fetch(`/api/admin/analytics?type=sales-trend&${query.toString()}`).then(r => r.json()),
        fetch(`/api/admin/analytics?type=payment-methods&${query.toString()}`).then(r => r.json()),
        fetch(`/api/admin/analytics?type=top-items&${query.toString()}`).then(r => r.json()),
      ]);

      if (resOverview.success) setOverview(resOverview.data);
      if (resTrend.success) setTrend(resTrend.data);
      if (resPayments.success) setPaymentMethods(resPayments.data);
      if (resItems.success) setTopItems(resItems.data);
    } catch (error) {
      console.error("Failed to load analytics", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap gap-2 mb-4">
        {["today", "yesterday", "last7", "last30"].map(range => (
          <Button
            key={range}
            variant={dateRange === range ? "default" : "outline"}
            onClick={() => setDateRange(range)}
          >
            {range === "today" ? "Today" : range === "yesterday" ? "Yesterday" : range === "last7" ? "Last 7 Days" : "Last 30 Days"}
          </Button>
        ))}
      </div>

      {overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-linear-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gross Sales</CardTitle>
              <DollarSign className="h-4 w-4 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{overview.grossSales?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-linear-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Sales</CardTitle>
              <TrendingUp className="h-4 w-4 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{overview.netSales?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-violet-500 to-violet-600 text-white border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalOrders || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-amber-500 to-amber-600 text-white border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <CreditCard className="h-4 w-4 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{Math.round(overview.averageOrderValue || 0)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-75">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-75">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="amount"
                    nameKey="_id"
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Top Selling Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-75">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItems} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="quantitySold" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
