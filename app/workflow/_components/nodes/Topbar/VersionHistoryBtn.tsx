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
import { HistoryIcon, RotateCcwIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVersionHistory, restoreVersion } from "@/actions/workflows/versionActions";
import { toast } from "sonner";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { WorkflowVersion } from "@prisma/client";

export default function VersionHistoryBtn({ workflowId }: { workflowId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: versions, isLoading } = useQuery<WorkflowVersion[]>({
    queryKey: ["versions", workflowId],
    queryFn: () => getVersionHistory(workflowId),
    enabled: open,
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId: string) => restoreVersion(workflowId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["versions", workflowId] });
      toast.success("Version restored successfully");
      setOpen(false);
      // Reload page to show restored workflow
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error("Failed to restore version", {
        description: error.message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <HistoryIcon size={14} />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            View and restore previous versions of this workflow
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : !versions || versions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No version history yet. Versions are created automatically when you save changes.
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Version {version.version}</span>
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      {version.changeMessage && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {version.changeMessage}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(version.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {index > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restoreMutation.mutate(version.id)}
                        disabled={restoreMutation.isPending}
                      >
                        <RotateCcwIcon size={14} className="mr-1" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
