import { TaskParamType, TaskType } from "@/types/task";
import { GitBranchIcon, LucideProps } from "lucide-react";

export const IfConditionTask = {
  type: TaskType.IF_CONDITION,
  label: "IF Condition",
  icon: (props: LucideProps) => (
    <GitBranchIcon className="stroke-pink-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Value A",
      type: TaskParamType.STRING,
      helperText: "First value to compare",
      required: true,
    },
    {
      name: "Operator",
      type: TaskParamType.STRING,
      helperText: "Comparison operator: ==, !=, >, <, >=, <=, contains",
      required: true,
    },
    {
      name: "Value B",
      type: TaskParamType.STRING,
      helperText: "Second value to compare",
      required: true,
    },
  ],
  outputs: [
    {
      name: "True Branch",
      type: TaskParamType.STRING,
    },
    {
      name: "False Branch",
      type: TaskParamType.STRING,
    },
  ],
  credits: 1,
};
