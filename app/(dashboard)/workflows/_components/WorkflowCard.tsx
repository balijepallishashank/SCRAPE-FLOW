"use client";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WorkflowStatus } from "@/types/workflow";
import { Workflow } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileTextIcon,
  MoreVerticalIcon,
  PlayIcon,
  TrashIcon,
  ChevronRightIcon,
  CoinsIcon,
  ClockIcon,
  CheckCircle2Icon,
  XCircleIcon,
  CopyIcon,
  UploadIcon,
  DownloadIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import DeleteWorkflowDialog from "./DeleteWorkflowDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { executeWorkflow } from "@/actions/workflows/executeWorkflow";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const statusColors = {
  [WorkflowStatus.DRAFT]: "text-yellow-500 bg-yellow-50",
  [WorkflowStatus.PUBLISHED]: "text-green-500 bg-green-50",
};

function WorkflowCard({ workflow }: { workflow: Workflow }) {
  const isDraft = workflow.status === WorkflowStatus.DRAFT;

  const executeMutation = useMutation({
    mutationFn: () => executeWorkflow(workflow.id),
    onSuccess: () => {
      toast.success("Workflow execution started");
    },
    onError: (error: any) => {
      toast.error("Failed to execute workflow", {
        description: error.message,
      });
    },
  });

  const handleRun = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    executeMutation.mutate();
  };

  return (
    <Card className="group relative border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 bg-card/50 backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Icon & Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <button
              onClick={handleRun}
              disabled={executeMutation.isPending}
              className={cn(
                "shrink-0 h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300",
                "bg-primary/10 hover:bg-primary/20 hover:scale-105 active:scale-95",
                "border-2 border-primary/30 hover:border-primary/60",
                "group-hover:shadow-lg group-hover:shadow-primary/20",
                executeMutation.isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              <PlayIcon className="h-5 w-5 fill-primary text-primary ml-0.5" />
            </button>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-3">
                <Link
                  href={`/workflow/editor/${workflow.id}`}
                  className="text-lg font-bold hover:text-primary transition-colors truncate group-hover:underline"
                >
                  {workflow.name}
                </Link>
                {isDraft ? (
                  <Badge variant="outline" className="shrink-0 border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-medium">
                    Draft
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0 border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                    Published
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-1">
                {workflow.description || "No description"}
              </p>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {workflow.lastRunAt && (
                  <div className="flex items-center gap-1.5">
                    <ClockIcon size={14} />
                    <span>Last run {new Date(workflow.lastRunAt).toLocaleDateString()}</span>
                  </div>
                )}

                {workflow.lastRunStatus && (
                  <div className="flex items-center gap-1.5">
                    {workflow.lastRunStatus === "COMPLETED" ? (
                      <CheckCircle2Icon size={14} className="text-green-500" />
                    ) : (
                      <XCircleIcon size={14} className="text-red-500" />
                    )}
                    <span className="capitalize">{workflow.lastRunStatus.toLowerCase()}</span>
                  </div>
                )}

                {workflow.creditsConsumed > 0 && (
                  <div className="flex items-center gap-1.5">
                    <CoinsIcon size={14} className="text-yellow-500" />
                    <span>{workflow.creditsConsumed} credits</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="default"
              size="sm"
              asChild
              className="shadow-sm hover:shadow-md transition-all"
            >
              <Link href={`/workflow/editor/${workflow.id}`}>
                Edit
                <ChevronRightIcon size={16} className="ml-1" />
              </Link>
            </Button>

            <WorkflowActions
              workflowName={workflow.name}
              workflowId={workflow.id}
              workflowStatus={workflow.status as WorkflowStatus}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkflowActions({
  workflowId,
  workflowName,
  workflowStatus,
}: {
  workflowId: string;
  workflowName: string;
  workflowStatus: WorkflowStatus;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const publishMutation = useMutation({
    mutationFn: async () => {
      const { publishWorkflow, unpublishWorkflow } = await import("@/actions/workflows/publishWorkflow");
      if (workflowStatus === WorkflowStatus.DRAFT) {
        return publishWorkflow({ workflowId });
      } else {
        return unpublishWorkflow({ workflowId });
      }
    },
    onSuccess: () => {
      toast.success(
        workflowStatus === WorkflowStatus.DRAFT
          ? "Workflow published successfully"
          : "Workflow unpublished successfully"
      );
      window.location.reload();
    },
    onError: () => {
      toast.error("Failed to update workflow status");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const { duplicateWorkflow } = await import("@/actions/workflows/duplicateWorkflow");
      return duplicateWorkflow(workflowId);
    },
    onSuccess: () => {
      toast.success("Workflow duplicated successfully");
      window.location.reload();
    },
    onError: () => {
      toast.error("Failed to duplicate workflow");
    },
  });

  return (
    <>
      <DeleteWorkflowDialog
        open={showDeleteDialog}
        setOpen={setShowDeleteDialog}
        workflowName={workflowName}
        workflowId={workflowId}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVerticalIcon size={18} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            className="flex items-center gap-2"
            onSelect={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
          >
            {workflowStatus === WorkflowStatus.DRAFT ? (
              <>
                <UploadIcon size={16} />
                Publish
              </>
            ) : (
              <>
                <DownloadIcon size={16} />
                Unpublish
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2"
            onSelect={() => duplicateMutation.mutate()}
            disabled={duplicateMutation.isPending}
          >
            <CopyIcon size={16} />
            Duplicate
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive flex items-center gap-2"
            onSelect={() => {
              setShowDeleteDialog(true);
            }}
          >
            <TrashIcon size={16} />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export default WorkflowCard;