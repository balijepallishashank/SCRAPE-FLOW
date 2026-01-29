"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WebhookIcon, CopyIcon, CheckIcon, Trash2Icon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWebhook, createWebhook, toggleWebhook, deleteWebhook } from "@/actions/workflows/webhookActions";
import { toast } from "sonner";
import { useState } from "react";

export default function WebhookBtn({ workflowId }: { workflowId: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: webhook, isLoading } = useQuery({
    queryKey: ["webhook", workflowId],
    queryFn: () => getWebhook(workflowId),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: () => createWebhook(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook", workflowId] });
      toast.success("Webhook created successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to create webhook", {
        description: error.message,
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      toggleWebhook(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook", workflowId] });
      toast.success("Webhook status updated");
    },
    onError: (error: any) => {
      toast.error("Failed to update webhook", {
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhook", workflowId] });
      toast.success("Webhook deleted");
    },
    onError: (error: any) => {
      toast.error("Failed to delete webhook", {
        description: error.message,
      });
    },
  });

  const webhookUrl = webhook
    ? `${window.location.origin}/api/webhook/${webhook.webhookPath}`
    : "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast.success("Webhook URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Clipboard blocked", {
        description: "Your browser blocked clipboard access. Copy the URL manually.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <WebhookIcon size={16} />
          Webhook
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Webhook Settings</DialogTitle>
          <DialogDescription>
            Manage your webhook URL and delivery settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : !webhook ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create a unique webhook URL to trigger this workflow from external services.
              </p>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="w-full"
              >
                Generate Webhook URL
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                  <Button size="icon" variant="outline" onClick={copyToClipboard}>
                    {copied ? (
                      <CheckIcon size={16} className="text-green-600" />
                    ) : (
                      <CopyIcon size={16} />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Send POST requests to this URL to trigger the workflow
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enabled</Label>
                    <p className="text-xs text-muted-foreground">
                      Toggle to enable/disable webhook
                    </p>
                  </div>
                  <Switch
                    checked={webhook.enabled}
                    onCheckedChange={(enabled) =>
                      toggleMutation.mutate({ id: webhook.id, enabled })
                    }
                    disabled={toggleMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label>Statistics</Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Triggers</p>
                    <p className="font-semibold">{webhook.triggerCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Triggered</p>
                    <p className="font-semibold">
                      {webhook.lastTriggeredAt
                        ? new Date(webhook.lastTriggeredAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(webhook.id)}
                  disabled={deleteMutation.isPending}
                  className="w-full"
                >
                  <Trash2Icon size={14} className="mr-2" />
                  Delete Webhook
                </Button>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label>Example cURL Request</Label>
                <div className="bg-slate-950 rounded p-3 font-mono text-xs text-white overflow-x-auto">
                  <pre>{`curl -X POST ${webhookUrl} \\\n+  -H "Content-Type: application/json" \\\n+  -d '{"data": "your data here"}'`}</pre>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
