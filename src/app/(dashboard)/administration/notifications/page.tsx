"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Send, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { toast } from "@/store";

export default function NotificationsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications?limit=50").then(r => r.json());
      if (res.success) {
        setLogs(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", "Failed to fetch notification logs");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    const phone = window.prompt("Enter phone number for test WhatsApp notification (e.g., +1234567890):");
    if (!phone) return;

    toast.info("Sending...", "Dispatching test notification");
    try {
      const res = await fetch("/api/admin/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "WHATSAPP",
          recipient: phone,
          message: "This is a test notification from DineFlow.",
        })
      }).then(r => r.json());

      if (res.success) {
        toast.success("Success", "Test notification sent");
        fetchLogs();
      } else {
        toast.error("Error", res.error || "Failed to send");
      }
    } catch (error) {
      toast.error("Error", "Failed to send test notification");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENT": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "FAILED": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "PROCESSING": return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SENT": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "FAILED": return "bg-destructive/10 text-destructive border-destructive/20";
      case "PROCESSING": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notification Logs</h2>
          <p className="text-muted-foreground">Monitor SMS, WhatsApp, and Email deliveries.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleTest}>
            <Send className="w-4 h-4 mr-2" />
            Send Test
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery History</CardTitle>
          <CardDescription>Recent outbound messages sent from your restaurant.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No notification logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.channel}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.recipient}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {log.eventType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <Badge variant="outline" className={getStatusBadge(log.status)}>
                              {log.status}
                            </Badge>
                          </div>
                          {log.errorMessage && (
                            <p className="text-xs text-destructive mt-1 max-w-50 truncate" title={log.errorMessage}>
                              {log.errorMessage}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{log.attempts}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
