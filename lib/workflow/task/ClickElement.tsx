import { TaskParamType, TaskType } from "@/types/task";
import { MousePointerClickIcon, LucideProps } from "lucide-react";

export const ClickElementTask = {
  type: TaskType.CLICK_ELEMENT,
  label: "Click element",
  icon: (props: LucideProps) => (
    <MousePointerClickIcon className="stroke-green-400" {...props} />
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
      helperText: "CSS selector for the element to click (e.g., 'button.submit', '#login-btn')",
      required: true,
    },
  ],
};
