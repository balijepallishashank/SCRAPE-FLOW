import { TaskParamType, TaskType } from "@/types/task";
import { Code2Icon, LucideProps } from "lucide-react";

export const TransformDataTask = {
  type: TaskType.TRANSFORM_DATA,
  label: "Transform Data",
  icon: (props: LucideProps) => (
    <Code2Icon className="stroke-emerald-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Input Data",
      type: TaskParamType.STRING,
      helperText: "Data to transform (JSON, text, etc.)",
      required: true,
      variant: "textarea",
    },
    {
      name: "Transformation Type",
      type: TaskParamType.STRING,
      helperText: "Type: parse-json, stringify-json, uppercase, lowercase, trim, split, join",
      required: true,
    },
    {
      name: "Options",
      type: TaskParamType.STRING,
      helperText: "Options for transformation (e.g., separator for split/join)",
      required: false,
    },
  ],
  outputs: [
    {
      name: "Transformed Data",
      type: TaskParamType.STRING,
    },
  ],
  credits: 1,
};
