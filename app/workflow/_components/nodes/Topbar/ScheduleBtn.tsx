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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSchedule } from "@/actions/workflows/scheduleWorkflow";
import { useMutation } from "@tanstack/react-query";
import { ClockIcon } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const CRON_PRESETS = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at 9 AM", value: "0 9 * * *" },
  { label: "Every day at 6 PM", value: "0 18 * * *" },
  { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
  { label: "Every weekday at 9 AM", value: "0 9 * * 1-5" },
  { label: "Every month on 1st at 9 AM", value: "0 9 1 * *" },
];

export default function ScheduleBtn({ workflowId }: { workflowId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cronExpression, setCronExpression] = useState("0 9 * * *");
  const [customCron, setCustomCron] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const scheduleMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      toast.success("Schedule created successfully");
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error("Failed to create schedule", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCron = useCustom ? customCron : cronExpression;

    if (!finalCron) {
      toast.error("Please provide a cron expression");
      return;
    }

    scheduleMutation.mutate({
      workflowId,
      cronExpression: finalCron,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <ClockIcon size={14} />
          Schedule
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Workflow</DialogTitle>
          <DialogDescription>
            Set up automatic execution of this workflow on a schedule
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Schedule Preset</Label>
            <Select
              value={useCustom ? "custom" : cronExpression}
              onValueChange={(value) => {
                if (value === "custom") {
                  setUseCustom(true);
                } else {
                  setUseCustom(false);
                  setCronExpression(value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a schedule" />
              </SelectTrigger>
              <SelectContent>
                {CRON_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom expression</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {useCustom && (
            <div className="space-y-2">
              <Label>Custom Cron Expression</Label>
              <Input
                placeholder="0 9 * * *"
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format: minute hour day month weekday
              </p>
            </div>
          )}

          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Current expression:</p>
            <code className="text-xs">
              {useCustom ? customCron || "Not set" : cronExpression}
            </code>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={scheduleMutation.isPending}>
              {scheduleMutation.isPending ? "Creating..." : "Create Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
