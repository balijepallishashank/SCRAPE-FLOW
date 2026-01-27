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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BellIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAlertConfig, updateAlertConfig } from "@/actions/alerts/alertActions";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function AlertsBtn({ workflowId }: { workflowId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["alerts", workflowId],
    queryFn: () => getAlertConfig(workflowId),
    enabled: open,
  });

  const [formData, setFormData] = useState({
    enabled: true,
    onSuccess: false,
    onFailure: true,
    emailEnabled: true,
    email: "",
    webhookEnabled: false,
    webhookUrl: "",
  });

  useEffect(() => {
    if (config) {
      setFormData({
        enabled: config.enabled,
        onSuccess: config.onSuccess,
        onFailure: config.onFailure,
        emailEnabled: config.emailEnabled,
        email: config.email || "",
        webhookEnabled: config.webhookEnabled,
        webhookUrl: config.webhookUrl || "",
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: () => updateAlertConfig({ workflowId, ...formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", workflowId] });
      toast.success("Alert settings saved");
    },
    onError: (error: any) => {
      toast.error("Failed to save alert settings", {
        description: error.message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <BellIcon size={14} />
          Alerts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Alert Configuration</DialogTitle>
          <DialogDescription>
            Get notified when workflows complete or fail
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Master switch for all alerts
              </p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(enabled) =>
                setFormData({ ...formData, enabled })
              }
            />
          </div>

          <div className="space-y-3 pt-2 border-t">
            <Label>Alert Conditions</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm">On Success</span>
              <Switch
                checked={formData.onSuccess}
                onCheckedChange={(onSuccess) =>
                  setFormData({ ...formData, onSuccess })
                }
                disabled={!formData.enabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">On Failure</span>
              <Switch
                checked={formData.onFailure}
                onCheckedChange={(onFailure) =>
                  setFormData({ ...formData, onFailure })
                }
                disabled={!formData.enabled}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label>Email Notifications</Label>
              <Switch
                checked={formData.emailEnabled}
                onCheckedChange={(emailEnabled) =>
                  setFormData({ ...formData, emailEnabled })
                }
                disabled={!formData.enabled}
              />
            </div>
            {formData.emailEnabled && (
              <Input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={!formData.enabled}
              />
            )}
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label>Webhook Notifications</Label>
              <Switch
                checked={formData.webhookEnabled}
                onCheckedChange={(webhookEnabled) =>
                  setFormData({ ...formData, webhookEnabled })
                }
                disabled={!formData.enabled}
              />
            </div>
            {formData.webhookEnabled && (
              <Input
                type="url"
                placeholder="https://your-webhook-url.com"
                value={formData.webhookUrl}
                onChange={(e) =>
                  setFormData({ ...formData, webhookUrl: e.target.value })
                }
                disabled={!formData.enabled}
              />
            )}
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full"
          >
            Save Alert Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
