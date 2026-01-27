"use client";

import { Button } from "@/components/ui/button";
import { executeWorkflow, ExecutionResult } from "@/actions/workflows/executeWorkflow";
import { useMutation } from "@tanstack/react-query";
import { PlayIcon, LoaderIcon } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function ExecuteBtn({ workflowId }: { workflowId: string }) {
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  const executeMutation = useMutation({
    mutationFn: () => executeWorkflow(workflowId),
    onSuccess: (result) => {
      setExecutionResult(result);
      setIsLogsOpen(true);
      
      if (result.success) {
        toast.success("Workflow executed successfully");
      } else {
        toast.error("Workflow execution failed", {
          description: result.error,
        });
      }
    },
    onError: (error: any) => {
      toast.error("Failed to execute workflow", {
        description: error.message,
      });
    },
  });

  const handleExecute = () => {
    toast.loading("Starting workflow execution...", { id: "execute-workflow" });
    executeMutation.mutate();
  };

  return (
    <>
      <Button
        disabled={executeMutation.isPending}
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
        onClick={handleExecute}
      >
        {executeMutation.isPending ? (
          <LoaderIcon size={16} className="animate-spin" />
        ) : (
          <PlayIcon size={16} />
        )}
        Execute
      </Button>

      <Sheet open={isLogsOpen} onOpenChange={setIsLogsOpen}>
        <SheetContent side="right" className="w-[600px] sm:w-[700px]">
          <SheetHeader>
            <SheetTitle>Execution Logs</SheetTitle>
            <SheetDescription>
              {executionResult?.success
                ? "Workflow executed successfully"
                : "Workflow execution failed"}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-4">
            <div className="space-y-2">
              {executionResult?.logs.map((log, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border text-sm",
                    log.level === "error" && "bg-destructive/10 border-destructive",
                    log.level === "success" && "bg-green-500/10 border-green-500",
                    log.level === "info" && "bg-muted"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{log.message}</p>
                      {log.taskType && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Task: {log.taskType}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {executionResult?.output && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Execution Output</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(executionResult.output, null, 2)}
                </pre>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
