import { TaskParamType, TaskType } from "@/types/task";
import { TimerIcon, LucideProps } from "lucide-react";

export const WaitForElementTask = {
  type: TaskType.WAIT_FOR_ELEMENT,
  label: "Wait for element",
  icon: (props: LucideProps) => (
    <TimerIcon className="stroke-yellow-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Web page",
      type: TaskParamType.BROWSER_INSTANCE,
      required: true,
    },
    {
      name: "Selector",
      type: TaskParamType.STRING,
      helperText: "CSS selector to wait for",
      required: true,
    },
    {
      name: "Timeout (ms)",
      type: TaskParamType.STRING,
      helperText: "Max wait time in milliseconds (default: 30000)",
      required: false,
    },
  ],
  outputs: [
    {
      name: "Web page",
      type: TaskParamType.BROWSER_INSTANCE,
    },
  ],
  credits: 1,
};
