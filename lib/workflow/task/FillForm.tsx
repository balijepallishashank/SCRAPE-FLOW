import { TaskParamType, TaskType } from "@/types/task";
import { Edit3Icon, LucideProps } from "lucide-react";

export const FillFormTask = {
  type: TaskType.FILL_FORM,
  label: "Fill form field",
  icon: (props: LucideProps) => (
    <Edit3Icon className="stroke-blue-400" {...props} />
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
      helperText: "CSS selector for the input field (e.g., '#email', 'input[name=\"username\"]')",
      required: true,
    },
    {
      name: "Value",
      type: TaskParamType.STRING,
      helperText: "Text to enter into the field",
      required: true,
    },
  ],
};
