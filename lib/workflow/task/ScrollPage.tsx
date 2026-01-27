import { TaskParamType, TaskType } from "@/types/task";
import { ArrowDownIcon, LucideProps } from "lucide-react";

export const ScrollPageTask = {
  type: TaskType.SCROLL_PAGE,
  label: "Scroll page",
  icon: (props: LucideProps) => (
    <ArrowDownIcon className="stroke-cyan-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Web page",
      type: TaskParamType.BROWSER_INSTANCE,
      required: true,
    },
    {
      name: "Scroll Amount",
      type: TaskParamType.STRING,
      helperText: "Pixels to scroll (e.g., '500') or 'bottom' to scroll to bottom",
      required: true,
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
