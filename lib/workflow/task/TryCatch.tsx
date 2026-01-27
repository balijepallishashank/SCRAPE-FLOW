import { TaskParamType, TaskType } from "@/types/task";
import { ShieldAlertIcon, LucideProps } from "lucide-react";

export const TryCatchTask = {
  type: TaskType.TRY_CATCH,
  label: "TRY-CATCH Block",
  icon: (props: LucideProps) => (
    <ShieldAlertIcon className="stroke-red-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Try Branch",
      type: TaskParamType.STRING,
      helperText: "Connect nodes to attempt execution",
      required: false,
      hideHandle: false,
    },
  ],
  outputs: [
    {
      name: "Success",
      type: TaskParamType.STRING,
    },
    {
      name: "Error",
      type: TaskParamType.STRING,
    },
  ],
  credits: 0,
};
