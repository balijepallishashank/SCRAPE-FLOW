import { TaskParamType, TaskType } from "@/types/task";
import { RepeatIcon, LucideProps } from "lucide-react";

export const ForEachLoopTask = {
  type: TaskType.FOR_EACH_LOOP,
  label: "FOR EACH Loop",
  icon: (props: LucideProps) => (
    <RepeatIcon className="stroke-indigo-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Array Data",
      type: TaskParamType.STRING,
      helperText: "JSON array to iterate over (e.g., [1,2,3] or [{\"name\":\"John\"}])",
      required: true,
      variant: "textarea",
    },
    {
      name: "Max Iterations",
      type: TaskParamType.STRING,
      helperText: "Maximum number of iterations (default: 100)",
      required: false,
    },
  ],
  outputs: [
    {
      name: "Current Item",
      type: TaskParamType.STRING,
    },
    {
      name: "Index",
      type: TaskParamType.STRING,
    },
  ],
  credits: 2,
};
