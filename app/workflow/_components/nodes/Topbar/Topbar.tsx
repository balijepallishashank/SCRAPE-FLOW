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
      {/* Top Section: Back + Title | Tabs | Actions */}
      <div className="grid items-center grid-cols-[1fr_auto_1fr] px-4 py-3">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3 justify-self-start">
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

        {/* Center: Tabs */}
        <div className="flex items-center justify-self-center rounded-full border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 p-1">
          <Link
            href={`/workflow/editor/${workflowId}`}
            className={cn(
              "px-4 py-1.5 text-sm font-medium transition-colors rounded-full",
              isEditorTab
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            )}
          >
            Editor
          </Link>
          <Link
            href={`/runs?workflowId=${workflowId}`}
            className={cn(
              "px-4 py-1.5 text-sm font-medium transition-colors rounded-full",
              isRunsTab
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            )}
          >
            Runs
          </Link>
        </div>
        
        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 justify-self-end">
          <ExecuteBtn workflowId={workflowId} />
          <SaveBtn workflowId={workflowId} />
          <PublishBtn workflowId={workflowId} />
        </div>
      </div>
    </header>
  );
}