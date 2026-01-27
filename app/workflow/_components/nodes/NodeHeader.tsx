"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { taskRegistry } from "@/lib/workflow/registry";
import { TaskType } from "@/types/task";
import { CoinsIcon, GripVertical } from "lucide-react";
import React from "react";

function NodeHeader({ taskType }: { taskType: TaskType }) {
  const task = taskRegistry[taskType];
  if (!task) return null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-t-xl bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-white/10">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-inner">
        <task.icon size={18} />
      </span>
      <div className="flex justify-between items-center w-full">
        <div className="flex flex-col leading-tight">
          <p className="text-xs font-bold uppercase text-neutral-900 dark:text-white tracking-wide">
            {task.label}
          </p>
          <p className="text-[11px] text-muted-foreground">{task.description || ""}</p>
        </div>
        <div className="flex gap-2 items-center">
          {task.isEntryPoint && (
            <Badge className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/30 text-[11px]">Entry point</Badge>
          )}
          <Badge className="gap-1.5 flex items-center text-[11px] bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-400/40">
            <CoinsIcon size={14} /> Todo
          </Badge>
          <Button
            variant={"ghost"}
            size={"icon"}
            className="drag-handle cursor-grab text-muted-foreground hover:text-foreground"
          >
            <GripVertical size={18} />
          </Button>

        </div>
      </div>
    </div>
  );
}

export default NodeHeader;