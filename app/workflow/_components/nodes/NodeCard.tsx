"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

function NodeCard({
  children,
  nodeId,
  isSelected,
}: {
  nodeId: string;
  isSelected: boolean;
  children: ReactNode;
}) {
  return (
    <div
      onDoubleClick={() => {}}
      className={cn(
        "rounded-xl cursor-pointer w-[440px] text-xs gap-1 flex flex-col",
        "bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-white/10 shadow-lg backdrop-blur",
        "transition-all duration-200 hover:shadow-xl dark:hover:shadow-primary/20 hover:border-primary/40",
        isSelected && "border-primary shadow-primary/30 shadow-lg"
      )}
    >
      {children}
    </div>
  );
}

export default NodeCard;
