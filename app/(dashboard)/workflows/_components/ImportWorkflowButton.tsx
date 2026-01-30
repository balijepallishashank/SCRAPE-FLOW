"use client";

import { useRef } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { importWorkflow } from "@/actions/workflows/importWorkflow";
import { useRouter } from "next/navigation";

export default function ImportWorkflowButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const payload = parsed?.workflow ?? parsed;

      const id = await importWorkflow(payload);
      toast.success("Workflow imported");
      router.push(`/workflow/editor/${id}`);
    } catch (error: any) {
      toast.error("Import failed", {
        description: error?.message || "Invalid workflow file",
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon size={16} />
        Import workflow
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
          event.currentTarget.value = "";
        }}
      />
    </>
  );
}
