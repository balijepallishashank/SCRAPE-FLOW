"use client";

import { CreateWorkflow } from "@/actions/workflows/createWorkflow";
import CustomDialogHeader from "@/components/CustomDialogHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createworkflowSchema } from "@/schema/workflow";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Layers2Icon, Loader2 } from "lucide-react";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

function CreateWorkflowDialog({ triggerText }: { triggerText?: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const form = useForm<z.infer<typeof createworkflowSchema>>({
    resolver: zodResolver(createworkflowSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: CreateWorkflow,
    onSuccess: (id: string) => {
      toast.success("Workflow created successfully!");
      setIsOpen(false);
      // Navigate to the newly created workflow editor using the returned id
      router.push(`/workflow/editor/${id}`);
    },
    onError: (error) => {
      toast.error("Failed to create workflow", {
        description: error.message,
      });
    },
  });

  const onSubmit = useCallback(
    (values: z.infer<typeof createworkflowSchema>) => {
      const loadingId = toast.loading("Creating workflow...");
      mutate(values, {
        onSuccess: () => {
          toast.dismiss(loadingId);
        },
        onError: () => {
          toast.dismiss(loadingId);
        },
      });
    },
    [mutate]
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) form.reset();
        setIsOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button>{triggerText ?? "Create Workflow"}</Button>
      </DialogTrigger>

      <DialogContent className="px-0">
        <CustomDialogHeader
          icon={Layers2Icon}
          title="Create New Workflow"
          subTitle="Start building your workflow"
        />

        <div className="p-6">
          <Form {...form}>
            <form
              className="space-y-8 w-full"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex gap-1 items-center">
                      Name
                      <p className="text-xs text-primary">(required)</p>
                    </FormLabel>

                    <FormControl>
                      <Input {...field} />
                    </FormControl>

                    <FormDescription>
                      Choose a descriptive and unique name
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex gap-1 items-center">
                      Description
                      <p className="text-xs text-muted-foreground">
                        (optional)
                      </p>
                    </FormLabel>

                    <FormControl>
                      <Textarea
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>

                    <FormDescription>
                      Provide a brief description of what your workflow does.
                      <br />
                      This is optional but helps remember its purpose.
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    Creating
                    <Loader2 className="animate-spin h-4 w-4 ml-2" />
                  </>
                ) : (
                  "Proceed"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateWorkflowDialog;