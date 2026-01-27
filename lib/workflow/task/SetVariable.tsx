import { TaskParamType, TaskType } from "@/types/task";
import { SaveIcon, LucideProps } from "lucide-react";

export const SetVariableTask = {
  type: TaskType.SET_VARIABLE,
  label: "Set Variable",
  icon: (props: LucideProps) => (
    <SaveIcon className="stroke-teal-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Variable Name",
      type: TaskParamType.STRING,
      helperText: "Name of the variable to set",
      required: true,
    },
    {
      name: "Value",
      type: TaskParamType.STRING,
      helperText: "Value to store in the variable",
      required: true,
      variant: "textarea",
    },
  ],
  credits: 0,
};
