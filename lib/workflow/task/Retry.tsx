import { TaskParamType, TaskType } from "@/types/task";
import { RefreshCwIcon, LucideProps } from "lucide-react";

export const RetryTask = {
  type: TaskType.RETRY,
  label: "Retry with Backoff",
  icon: (props: LucideProps) => (
    <RefreshCwIcon className="stroke-amber-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Max Attempts",
      type: TaskParamType.STRING,
      helperText: "Maximum number of retry attempts (default: 3)",
      required: false,
    },
    {
      name: "Backoff Seconds",
      type: TaskParamType.STRING,
      helperText: "Delay between retries in seconds (default: 2)",
      required: false,
    },
  ],
  outputs: [
    {
      name: "Result",
      type: TaskParamType.STRING,
    },
  ],
  credits: 1,
};
