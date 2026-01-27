import { TaskParamType, TaskType } from "@/types/task";
import { DatabaseIcon, LucideProps } from "lucide-react";

export const StoreDataTask = {
  type: TaskType.STORE_DATA,
  label: "Store Data (Persistent)",
  icon: (props: LucideProps) => (
    <DatabaseIcon className="stroke-violet-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Storage Key",
      type: TaskParamType.STRING,
      helperText: "Unique key to store data under",
      required: true,
    },
    {
      name: "Data",
      type: TaskParamType.STRING,
      helperText: "Data to store (persists across workflow runs)",
      required: true,
      variant: "textarea",
    },
  ],
  credits: 1,
};
