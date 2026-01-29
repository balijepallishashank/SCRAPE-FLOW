"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Trash2, Download } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

async function deleteAllFailedRuns() {
  const response = await fetch("/api/runs/delete-failed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete failed runs");
  }

  return response.json();
}

export default function RunsPageHeaderActions() {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteFailedMutation = useMutation({
    mutationFn: deleteAllFailedRuns,
    onSuccess: (data) => {
      toast.success(`Deleted ${data.deletedCount} failed runs`);
      setShowDeleteConfirm(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to delete failed runs", {
        description: error.message,
      });
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Run Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All Failed Runs
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem disabled className="text-muted-foreground">
            <Download className="w-4 h-4 mr-2" />
            Export as CSV (Coming soon)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Failed Runs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all failed workflow runs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFailedMutation.mutate()}
              disabled={deleteFailedMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteFailedMutation.isPending ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
