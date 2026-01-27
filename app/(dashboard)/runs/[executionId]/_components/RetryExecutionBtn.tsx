"use client";

import { Button } from "@/components/ui/button";
import { executeWorkflow } from "@/actions/workflows/executeWorkflow";
import { useMutation } from "@tanstack/react-query";
import { RotateCcwIcon, LoaderIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function RetryExecutionBtn({ workflowId }: { workflowId: string }) {
  const router = useRouter();
  
  const retryMutation = useMutation({
    mutationFn: () => executeWorkflow(workflowId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Workflow retry started successfully");
        router.refresh();
      } else {
        toast.error("Workflow retry failed", {
          description: result.error,
        });
      }
    },
    onError: (error: any) => {
      toast.error("Failed to retry workflow", {
        description: error.message,
      });
    },
  });

  return (
    <Button
      disabled={retryMutation.isPending}
      onClick={() => retryMutation.mutate()}
      variant="outline"
      className="flex items-center gap-2"
    >
      {retryMutation.isPending ? (
        <LoaderIcon size={16} className="animate-spin" />
      ) : (
        <RotateCcwIcon size={16} />
      )}
      Retry Execution
    </Button>
  );
}
