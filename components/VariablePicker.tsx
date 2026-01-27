"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, Braces } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReactFlow } from "@xyflow/react";
import { AppNode } from "@/types/appNode";
import { TaskRegistry } from "@/lib/workflow/task/registry";

interface VariablePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  currentNodeId?: string;
  label?: string;
  className?: string;
}

export default function VariablePicker({
  value = "",
  onChange,
  placeholder = "Enter value or select variable",
  currentNodeId,
  label,
  className,
}: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { getNodes, getEdges } = useReactFlow();
  const [availableVariables, setAvailableVariables] = useState<
    Array<{ nodeId: string; nodeName: string; outputs: string[] }>
  >([]);

  useEffect(() => {
    if (!currentNodeId || !isOpen) return;

    const nodes = getNodes() as AppNode[];
    const edges = getEdges();

    // Find upstream nodes (nodes that have edges leading to current node)
    const upstreamNodeIds = new Set<string>();
    const visited = new Set<string>();

    const findUpstream = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      edges.forEach((edge) => {
        if (edge.target === nodeId) {
          upstreamNodeIds.add(edge.source);
          findUpstream(edge.source);
        }
      });
    };

    findUpstream(currentNodeId);

    // Get variables from upstream nodes
    const variables = Array.from(upstreamNodeIds)
      .map((nodeId) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return null;

        const task = TaskRegistry[node.data.type];
        if (!task) return null;

        const outputs = task.outputs?.map((output) => output.name) || [];
        if (outputs.length === 0) return null;

        return {
          nodeId: node.id,
          nodeName: node.data.label || task.label,
          outputs,
        };
      })
      .filter((v) => v !== null);

    setAvailableVariables(variables);
  }, [currentNodeId, isOpen, getNodes, getEdges]);

  const insertVariable = (nodeId: string, outputName: string) => {
    const variable = `{{${nodeId}.${outputName}}}`;
    // Insert at cursor position or append
    onChange(value + variable);
    setIsOpen(false);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label>{label}</Label>}
      <div className="relative flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 h-7 w-7 p-0"
            >
              <Braces className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="border-b px-3 py-2">
              <div className="font-semibold text-sm">Available Variables</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                From upstream nodes
              </p>
            </div>

            {availableVariables.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                No upstream nodes with outputs. Connect nodes to see variables.
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto p-2">
                {availableVariables.map((variable) => (
                  <div key={variable.nodeId} className="mb-3 last:mb-0">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                      {variable.nodeName}
                    </div>
                    <div className="space-y-1">
                      {variable.outputs.map((output) => (
                        <Button
                          key={`${variable.nodeId}-${output}`}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left font-mono text-xs h-8"
                          onClick={() =>
                            insertVariable(variable.nodeId, output)
                          }
                        >
                          <code className="text-primary">
                            {`{{${variable.nodeId}.${output}}}`}
                          </code>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
      {value.includes("{{") && (
        <p className="text-xs text-muted-foreground">
          Variables will be replaced with actual values during execution
        </p>
      )}
    </div>
  );
}
