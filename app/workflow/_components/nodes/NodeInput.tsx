"use client";

import { Handle, Position } from "@xyflow/react";
import { TaskParam } from "@/types/task";
import NodeParamField from "./NodeParamField";
import { cn } from "@/lib/utils";

export function NodeInput({
  input,
  nodeId,
}: {
  input: TaskParam;
  nodeId: string;
}) {
  return (
    <div className="flex justify-start relative p-3 bg-secondary w-full rounded-md">
      {/* Input field */}
      <NodeParamField param={input} nodeId={nodeId} />

      {/* Connection handle */}
      {!input.hideHandle && (
        <Handle
          id={input.name}
          type="target"
          position={Position.Left}
          className={cn(
            "!bg-muted-foreground !border-2 !border-background !-left-2 !w-4 !h-4"
          )}
        />
      )}
    </div>
  );
}
