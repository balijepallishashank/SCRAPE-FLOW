"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeftIcon, PlayIcon, SaveIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import TooltipWrapper from "@/components/TooltipWrapper";
import SaveBtn from "./SaveBtn";
import ExecuteBtn from "./ExecuteBtn";
import PublishBtn from "./PublishBtn";
import { useEditorContext } from "../../FlowEditor";
import Link from "next/link";
import { cn } from "@/lib/utils";


interface Props {
  title: string;
  subtitle?: string;
  workflowId: string;
}

export default function Topbar({ title, subtitle, workflowId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { saveState } = useEditorContext();
  
  const isEditorTab = pathname.includes("/editor/");
  const isRunsTab = pathname.includes("/runs/");
  
  return (
    <header className="flex flex-col w-full sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-white/10 z-20">
      {/* Top Section: Back + Title + Actions */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3">
          <TooltipWrapper content="Back">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white" 
              onClick={() => router.back()}
            >
              <ChevronLeftIcon size={18} />
            </Button>
          </TooltipWrapper>
          <div>
            <h1 className="font-semibold text-sm text-neutral-900 dark:text-white">{title}</h1>
            {subtitle && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <ExecuteBtn workflowId={workflowId} />
          <SaveBtn workflowId={workflowId} />
          <PublishBtn workflowId={workflowId} />
        </div>
      </div>
      
      {/* Bottom Section: Tabs */}
      <div className="flex items-center px-4 border-t border-neutral-200 dark:border-white/10">
        <Link
          href={`/workflow/editor/${workflowId}`}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors relative",
            isEditorTab
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          )}
        >
          Editor
          {isEditorTab && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white" />
          )}
        </Link>
        <Link
          href={`/runs?workflowId=${workflowId}`}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors relative",
            isRunsTab
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          )}
        >
          Runs
          {isRunsTab && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white" />
          )}
        </Link>
      </div>
    </header>
  );
}