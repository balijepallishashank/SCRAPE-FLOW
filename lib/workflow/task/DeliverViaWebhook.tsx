import { TaskParamType, TaskType } from "@/types/task";
import { WebhookIcon, LucideProps } from "lucide-react";

export const DeliverViaWebhookTask = {
  type: TaskType.DELIVER_VIA_WEBHOOK,
  label: "Deliver via webhook",
  icon: (props: LucideProps) => (
    <WebhookIcon className="stroke-purple-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "Target URL",
      type: TaskParamType.STRING,
      helperText: "Webhook endpoint URL",
      required: true,
    },
    {
      name: "Body",
      type: TaskParamType.STRING,
      helperText: "Data to send (JSON format)",
      required: true,
      variant: "textarea",
    },
  ],
  outputs: [
    {
      name: "Response Status",
      type: TaskParamType.STRING,
    },
  ],
  credits: 1,
};
