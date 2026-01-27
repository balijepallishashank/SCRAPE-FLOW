import { TaskParamType, TaskType } from "@/types/task";
import { NavigationIcon, LucideProps } from "lucide-react";

export const NavigateUrlTask = {
  type: TaskType.NAVIGATE_URL,
  label: "Navigate to URL",
  icon: (props: LucideProps) => (
    <NavigationIcon className="stroke-blue-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Web page",
      type: TaskParamType.BROWSER_INSTANCE,
      required: true,
    },
    {
      name: "URL",
      type: TaskParamType.STRING,
      helperText: "e.g., https://example.com",
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
