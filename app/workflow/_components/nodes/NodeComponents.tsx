"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";

import { taskRegistry } from "@/lib/workflow/registry";
import { AppNodeData } from "@/types/appNode";

import NodeCard from "./NodeCard";
import NodeHeader from "./NodeHeader";
import NodeInputs from "./NodeInputs";
import { NodeInput } from "./NodeInput";
import { Handle, Position } from "@xyflow/react";

/* ------------------------------------------------------------------ */
/* Node Component */
/* ------------------------------------------------------------------ */

const NodeComponent = memo((props: NodeProps) => {
  const nodeData = props.data as AppNodeData;
  const task = taskRegistry[nodeData.type];

  if (!task) {
    return (
      <div className="p-4 border rounded-md bg-destructive text-destructive-foreground">
        Unknown node type
      </div>
    );
  }

  return (
    <NodeCard
      nodeId={props.id}
      isSelected={props.selected ?? false}
    >
      {/* Header */}
      <NodeHeader taskType={nodeData.type} />

      {/* Inputs */}
      <NodeInputs>
        {task.inputs.map((input) => (
          <NodeInput
            key={input.name}
            input={input}
            nodeId={props.id}
          />
        ))}
      </NodeInputs>

      {/* Outputs */}
      {task.outputs && task.outputs.length > 0 && (
        <div className="flex flex-col gap-2 px-3 pb-3 pt-1">
          {task.outputs.map((output) => (
            <div
              key={output.name}
              className="flex items-center justify-between bg-secondary rounded-md px-3 py-2 relative"
            >
              <span className="text-[11px] font-medium text-muted-foreground">
                {output.name}
              </span>
              <Handle
                id={output.name}
                type="source"
                position={Position.Right}
                className="!bg-muted-foreground !border-2 !border-background !-right-2 !w-4 !h-4"
              />
            </div>
          ))}
        </div>
      )}
    </NodeCard>
  );
});

NodeComponent.displayName = "NodeComponent";

export default NodeComponent;
