"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";

import { taskRegistry } from "@/lib/workflow/registry";
import { AppNodeData } from "@/types/appNode";

import NodeCard from "./NodeCard";
import NodeHeader from "./NodeHeader";
import NodeInputs from "./NodeInputs";
import { NodeInput } from "./NodeInput";

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
    </NodeCard>
  );
});

NodeComponent.displayName = "NodeComponent";

export default NodeComponent;
