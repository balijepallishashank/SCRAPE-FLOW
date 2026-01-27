"use client";

import { UpdateWorkflow } from "@/actions/workflows/updateWorkflow";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useReactFlow } from "@xyflow/react";
import { CheckIcon, AlertTriangleIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { validateWorkflow } from "@/lib/workflow/validation";
import { AppNode } from "@/types/appNode";

export default function SaveBtn({ workflowId }: { workflowId: string }) {
  const { toObject, getNodes, getEdges } = useReactFlow();
  
  const saveMutation = useMutation({
    mutationFn: UpdateWorkflow,
    onSuccess: () => {
      toast.success("Workflow saved successfully", { id: "save-workflow" });
    },
    onError: (error) => {
      toast.error("Failed to save workflow", { 
        id: "save-workflow",
        description: error.message 
      });
    },
  });

  const handleSave = () => {
    // Validate workflow before saving
    const nodes = getNodes() as AppNode[];
    const edges = getEdges();
    const errors = validateWorkflow(nodes, edges);

    if (errors.length > 0) {
      toast.error("Workflow validation failed", {
        id: "save-workflow",
        description: `Found ${errors.length} error(s). Check console for details.`,
      });
      console.error("Validation errors:", errors);
      
      // Show first few errors as toasts
      errors.slice(0, 3).forEach((error) => {
        toast.error(error.message, {
          description: error.nodeId ? `Node: ${error.nodeId}` : undefined,
        });
      });
      return;
    }

    const workflowDefinition = JSON.stringify(toObject());
    toast.loading("Saving workflow...", { id: "save-workflow" });
    saveMutation.mutate({
      id: workflowId,
      definition: workflowDefinition,
    });
  };

  return (
    <Button
      disabled={saveMutation.isPending}
      variant="ghost"
      size="sm"
      className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
      onClick={handleSave}
    >
      <CheckIcon size={16} />
      Save
    </Button>
  );
}