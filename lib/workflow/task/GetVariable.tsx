import { TaskParamType, TaskType } from "@/types/task";
import { DownloadIcon, LucideProps } from "lucide-react";

export const GetVariableTask = {
  type: TaskType.GET_VARIABLE,
  label: "Get Variable",
  icon: (props: LucideProps) => (
    <DownloadIcon className="stroke-lime-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Variable Name",
      type: TaskParamType.STRING,
      helperText: "Name of the variable to retrieve",
      required: true,
    },
  ],
  outputs: [
    {
      name: "Value",
      type: TaskParamType.STRING,
    },
  ],
  credits: 0,
};
