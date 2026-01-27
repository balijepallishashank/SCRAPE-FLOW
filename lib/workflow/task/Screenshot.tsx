import { TaskParamType, TaskType } from "@/types/task";
import { CameraIcon, LucideProps } from "lucide-react";

export const ScreenshotTask = {
  type: TaskType.SCREENSHOT,
  label: "Take screenshot",
  icon: (props: LucideProps) => (
    <CameraIcon className="stroke-purple-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Web page",
      type: TaskParamType.BROWSER_INSTANCE,
      required: true,
    },
  ],
};
