"use client";

import { Button } from "@/components/ui/button";
import { DownloadIcon, UploadIcon } from "lucide-react";
import React, { useRef } from "react";
import { toast } from "sonner";
import { useReactFlow } from "@xyflow/react";
import { useMutation } from "@tanstack/react-query";
import { UpdateWorkflow } from "@/actions/workflows/updateWorkflow";

export function ExportBtn({ workflowId, workflowName }: { workflowId: string; workflowName: string }) {
  const { toObject } = useReactFlow();

  const handleExport = () => {
    try {
      const workflowData = toObject();
      const exportData = {
        version: "1.0",
        name: workflowName,
        definition: workflowData,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${workflowName.replace(/[^a-z0-9]/gi, "_")}_workflow.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Workflow exported successfully");
    } catch (error) {
      toast.error("Failed to export workflow");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      onClick={handleExport}
    >
      <DownloadIcon size={14} />
      Export
    </Button>
  );
}

export function ImportBtn({ workflowId }: { workflowId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setNodes, setEdges, setViewport } = useReactFlow();

  const importMutation = useMutation({
    mutationFn: UpdateWorkflow,
    onSuccess: () => {
      toast.success("Workflow imported successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to save imported workflow", {
        description: error.message,
      });
    },
  });

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.definition) {
        throw new Error("Invalid workflow file format");
      }

      const { nodes, edges, viewport } = importData.definition;

      setNodes(nodes || []);
      setEdges(edges || []);
      if (viewport) {
        setViewport(viewport);
      }

      // Save to database
      const workflowDefinition = JSON.stringify(importData.definition);
      importMutation.mutate({
        id: workflowId,
        definition: workflowDefinition,
      });

      toast.success("Workflow imported successfully");
    } catch (error) {
      toast.error("Failed to import workflow", {
        description: "Invalid file format or corrupted data",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon size={14} />
        Import
      </Button>
    </>
  );
}
