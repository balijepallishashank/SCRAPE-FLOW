"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon } from "lucide-react";
import { publishWorkflow } from "@/actions/workflows/publishWorkflow";
import { toast } from "sonner";

interface Props {
  workflowId: string;
}

export default function PublishBtn({ workflowId }: Props) {
  const mutation = useMutation({
    mutationFn: publishWorkflow,
    onSuccess: () => {
      toast.success("Workflow published", { id: workflowId });
    },
    onError: () => {
      toast.error("Something went wrong", { id: workflowId });
    },
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={mutation.isPending}
      className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
      onClick={() => {
        toast.loading("Publishing workflow...", { id: workflowId });
        mutation.mutate({ workflowId });
      }}
    >
      <CheckCircle2Icon size={16} />
      {mutation.isPending ? "Publishing..." : "Publish"}
    </Button>
  );
}
