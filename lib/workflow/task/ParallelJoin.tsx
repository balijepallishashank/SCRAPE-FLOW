import { TaskType, WorkflowTask, TaskParamType } from "@/types/task";
import { MergeIcon, LucideProps } from "lucide-react";

export const ParallelJoinTask = {
  type: TaskType.PARALLEL_JOIN,
  label: "Parallel Join",
  icon: (props: LucideProps) => <MergeIcon {...props} />,
  isEntryPoint: false,
  credits: 0,
  inputs: [
    {
      name: "Branch 1",
      type: TaskParamType.STRING,
      helperText: "First parallel branch result",
    },
    {
      name: "Branch 2",
      type: TaskParamType.STRING,
      helperText: "Second parallel branch result",
    },
    {
      name: "Branch 3",
      type: TaskParamType.STRING,
      helperText: "Third parallel branch result",
    },
  ] as const,
  outputs: [
    {
      name: "Combined Result",
      type: "string" as const,
    },
  ] as const,
} satisfies WorkflowTask;
