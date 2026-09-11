"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit } from "lucide-react";
import { toast } from "@/store";
import { Badge } from "@/components/ui/badge";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/templates").then(r => r.json());
      if (res.success) {
        setTemplates(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", "Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const templateKey = window.prompt("Template Key (e.g. ORDER_CONFIRMED):");
    if (!templateKey) return;
    
    const channel = window.prompt("Channel (WHATSAPP, EMAIL, SMS):");
    if (!channel) return;
    
    const body = window.prompt("Template Body (use {{variables}}):");
    if (!body) return;

    toast.info("Saving...", "Creating template");
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey,
          channel: channel.toUpperCase(),
          eventType: templateKey,
          body,
          language: "en",
          variables: ["customerName", "orderNumber"] // Just mock variables for creation UI
        })
      }).then(r => r.json());

      if (res.success) {
        toast.success("Success", "Template created successfully");
        fetchTemplates();
      } else {
        toast.error("Error", res.error || "Failed to create template");
      }
    } catch (error) {
      toast.error("Error", "Failed to create template");
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notification Templates</h2>
          <p className="text-muted-foreground">Manage templates for WhatsApp, Email, and SMS.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Templates</CardTitle>
          <CardDescription>Customized templates override system defaults.</CardDescription>
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
                    <TableHead>Template Key</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No custom templates found. System defaults will be used.
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template) => (
                      <TableRow key={template._id}>
                        <TableCell className="font-medium">{template.templateKey}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.channel}</Badge>
                        </TableCell>
                        <TableCell>{template.language}</TableCell>
                        <TableCell>
                          {template.isActive ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground max-w-xs truncate" title={template.body}>
                            {template.body}
                          </p>
                        </TableCell>
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
