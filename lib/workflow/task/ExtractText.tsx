import { TaskParamType, TaskType } from "@/types/task";
import { TextIcon, LucideProps } from "lucide-react";

export const ExtractTextTask = {
  type: TaskType.EXTRACT_TEXT,
  label: "Extract text from element",
  icon: (props: LucideProps) => (
    <TextIcon className="stroke-orange-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Html",
      type: TaskParamType.STRING,
      required: true,
      variant: "textarea",
    },
    {
      name: "Selector",
      type: TaskParamType.STRING,
      helperText: "CSS selector (e.g., 'div.content', '#main', 'p')",
      required: true,
    },
  ],
};
