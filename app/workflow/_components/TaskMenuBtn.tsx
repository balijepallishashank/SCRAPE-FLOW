"use client";

import React, { useCallback } from "react";
import { TaskType } from "@/types/task";
import { TaskRegistry } from "@/lib/workflow/task/registry";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useReactFlow } from "@xyflow/react";
import { CreateFlowNode } from "@/lib/workflow/createFlowNode";

interface TaskMenuBtnProps {
  taskType: TaskType;
}

export default function TaskMenuBtn({ taskType }: TaskMenuBtnProps) {
  const cfg = TaskRegistry[taskType];
  if (!cfg) return null;
  const { addNodes } = useReactFlow();

  const handleClick = useCallback(() => {
    const node = CreateFlowNode(taskType);
    addNodes(node);
  }, [addNodes, taskType]);

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData("application/reactflow", taskType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <Button
      variant="outline"
      className="justify-start gap-3 w-full bg-neutral-50 dark:bg-neutral-900/70 text-neutral-900 dark:text-foreground border border-neutral-200 dark:border-white/10 hover:border-primary/60 hover:bg-neutral-100 dark:hover:bg-neutral-900 shadow-sm hover:shadow-primary/20 transition-all rounded-xl"
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
    >
      <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 text-primary shadow-inner">
        <cfg.icon size={16} />
      </span>
      <div className="flex flex-col items-start flex-1">
        <span className="text-sm font-semibold text-neutral-900 dark:text-white">{cfg.label}</span>
        {cfg.description && (
          <span className="text-[11px] text-muted-foreground line-clamp-1">{cfg.description}</span>
        )}
      </div>
      <span className="text-[11px] px-2 py-1 rounded-full bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-muted-foreground">
        {cfg.inputs?.length ?? 0}
      </span>
    </Button>
  );
}
