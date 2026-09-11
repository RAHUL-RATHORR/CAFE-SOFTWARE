"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCcw, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BackupsPage() {
  const { toast } = useToast();
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchBackups = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/backups");
      if (!res.ok) throw new Error("Failed to fetch backups");
      const data = await res.json();
      setBackups(data.data || []);
    } catch (error: any) {
      toast({
        title: "Fetch Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateBackup = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch("/api/admin/backups", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate backup");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dineflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Backup Generated",
        description: "Your system backup has been downloaded successfully.",
      });

      fetchBackups(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Backups</h2>
          <p className="text-muted-foreground">
            Generate and download secure snapshots of your restaurant&apos;s business data.
          </p>
        </div>
        <Button onClick={generateBackup} disabled={isGenerating}>
          {isGenerating ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {isGenerating ? "Generating..." : "Generate New Backup"}
        </Button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-4 flex items-start gap-4 text-amber-600">
        <ShieldAlert className="h-5 w-5 mt-0.5" />
        <div>
          <h4 className="font-semibold">Security Notice</h4>
          <p className="text-sm mt-1">
            Backups contain sensitive business data including sales, customer information, and inventory. 
            All passwords, secrets, and API keys are automatically stripped. Please store these files securely.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Backups</CardTitle>
            <CardDescription>History of backups generated in this session.</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={fetchBackups} disabled={isLoading}>
            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created At</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No recent backups found. Click &quot;Generate New Backup&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>{new Date(backup.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{backup.createdBy}</TableCell>
                    <TableCell>v{backup.version}</TableCell>
                    <TableCell>{backup.size}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 font-medium">
                        {backup.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
