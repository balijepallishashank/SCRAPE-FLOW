import { TaskType, WorkflowTask, TaskParamType } from "@/types/task";
import { SplitIcon, LucideProps } from "lucide-react";

export const ParallelSplitTask = {
  type: TaskType.PARALLEL_SPLIT,
  label: "Parallel Split",
  icon: (props: LucideProps) => <SplitIcon {...props} />,
  isEntryPoint: false,
  credits: 0,
  inputs: [
    {
      name: "Input Data",
      type: TaskParamType.STRING,
      helperText: "Data to process in parallel",
    },
  ] as const,
  outputs: [
    {
      name: "Branch 1",
      type: "string" as const,
    },
    {
      name: "Branch 2",
      type: "string" as const,
    },
    {
      name: "Branch 3",
      type: "string" as const,
    },
  ] as const,
} satisfies WorkflowTask;
