import { AppNode } from "@/types/appNode";
import { TaskRegistry } from "@/lib/workflow/task/registry";
import { Edge } from "@xyflow/react";

export interface ValidationError {
  nodeId: string;
  message: string;
}

export function validateWorkflow(
  nodes: AppNode[],
  edges: Edge[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if there's at least one entry point
  const hasEntryPoint = nodes.some((node) => {
    const task = TaskRegistry[node.data.type];
    return task?.isEntryPoint === true;
  });

  if (!hasEntryPoint && nodes.length > 0) {
    errors.push({
      nodeId: "",
      message: "Workflow must have at least one entry point (Launch Browser)",
    });
  }

  // Validate each node
  nodes.forEach((node) => {
    const task = TaskRegistry[node.data.type];

    if (!task) {
      errors.push({
        nodeId: node.id,
        message: `Unknown task type: ${node.data.type}`,
      });
      return;
    }

    // Check required inputs
    task.inputs?.forEach((input) => {
      if (input.required) {
        const value = node.data.inputs?.[input.name];

        // Check if value exists for inputs that don't hide handle (user-provided)
        if (input.hideHandle && (!value || value.trim() === "")) {
          errors.push({
            nodeId: node.id,
            message: `Missing required input: ${input.name}`,
          });
        }

        // Check if connected for inputs with handles
        if (!input.hideHandle) {
          const hasConnection = edges.some(
            (edge) => edge.target === node.id && edge.targetHandle === input.name
          );

          if (!hasConnection) {
            errors.push({
              nodeId: node.id,
              message: `Missing connection for: ${input.name}`,
            });
          }
        }
      }
    });
  });

  // Check for disconnected nodes (except entry points)
  nodes.forEach((node) => {
    const task = TaskRegistry[node.data.type];
    if (task?.isEntryPoint) return;

    const hasIncomingConnection = edges.some((edge) => edge.target === node.id);

    if (!hasIncomingConnection && task?.inputs && task.inputs.length > 0) {
      errors.push({
        nodeId: node.id,
        message: "Node is not connected to any input",
      });
    }
  });

  return errors;
}
