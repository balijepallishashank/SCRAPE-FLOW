"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export default function TemplateCreatePage({ params }: { params: { templateId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const createWorkflow = async () => {
      try {
        const definition = searchParams.get("definition");
        
        if (!definition) {
          throw new Error("Template definition not found");
        }

        const parsedDefinition = JSON.parse(decodeURIComponent(definition));

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`/api/templates/${params.templateId}/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ definition: parsedDefinition }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create workflow");
        }

        const data = await response.json();
        
        toast.success("Workflow created successfully!", {
          description: "Opening editor...",
        });

        router.push(`/workflow/${data.workflowId}`);
      } catch (error) {
        console.error("Error:", error);
        const message =
          error instanceof Error && error.name === "AbortError"
            ? "Request timed out. Please try again."
            : error instanceof Error
            ? error.message
            : "Unknown error";
        toast.error("Failed to create workflow", {
          description: message,
        });
        router.back();
      }
    };

    startTransition(() => {
      createWorkflow();
    });
  }, [params.templateId, router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-semibold">Creating workflow from template...</p>
        <p className="text-sm text-muted-foreground">This will only take a moment</p>
      </div>
    </div>
  );
}
