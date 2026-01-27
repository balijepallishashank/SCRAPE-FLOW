import { TaskType, WorkflowTask, TaskParamType } from "@/types/task";
import { WorkflowIcon, LucideProps } from "lucide-react";

export const CallWorkflowTask = {
  type: TaskType.CALL_WORKFLOW,
  label: "Call Workflow",
  icon: (props: LucideProps) => <WorkflowIcon {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    {
      name: "Workflow ID",
      type: TaskParamType.STRING,
      required: true,
      helperText: "ID of the workflow to execute",
    },
    {
      name: "Input Data",
      type: TaskParamType.STRING,
      helperText: "Data to pass to the workflow (JSON)",
    },
  ] as const,
  outputs: [
    {
      name: "Workflow Result",
      type: "string" as const,
    },
    {
      name: "Execution ID",
      type: "string" as const,
    },
  ] as const,
} satisfies WorkflowTask;
