import { TaskParamType, TaskType } from "@/types/task";
import { HardDriveIcon, LucideProps } from "lucide-react";

export const RetrieveDataTask = {
  type: TaskType.RETRIEVE_DATA,
  label: "Retrieve Data (Persistent)",
  icon: (props: LucideProps) => (
    <HardDriveIcon className="stroke-fuchsia-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Storage Key",
      type: TaskParamType.STRING,
      helperText: "Key to retrieve stored data",
      required: true,
    },
  ],
  outputs: [
    {
      name: "Data",
      type: TaskParamType.STRING,
    },
  ],
  credits: 1,
};
