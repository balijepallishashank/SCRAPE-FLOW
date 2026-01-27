import { TaskType, WorkflowTask } from "@/types/task";
import { PlayCircleIcon, LucideProps } from "lucide-react";

export const EventTriggerTask = {
  type: TaskType.EVENT_TRIGGER,
  label: "Event Trigger",
  icon: (props: LucideProps) => <PlayCircleIcon {...props} />,
  isEntryPoint: true,
  credits: 0,
  inputs: [] as const,
  outputs: [
    {
      name: "Event Type",
      type: "string" as const,
    },
    {
      name: "Event Data",
      type: "string" as const,
    },
    {
      name: "Timestamp",
      type: "string" as const,
    },
  ] as const,
} satisfies WorkflowTask;
