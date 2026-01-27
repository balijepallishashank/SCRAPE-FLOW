import React, { Suspense } from "react";
import { getWorkflowsForUser } from "@/actions/workflows/getWorkflowsForUser";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertCircle, InboxIcon } from "lucide-react";
import CreateWorkflowDialog from "./_components/CreateWorkflowDialog";
import WorkflowCard from "./_components/WorkflowCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Page Wrapper */
/* ------------------------------------------------------------------ */

export default function Page() {
  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Manage your workflows
          </p>
        </div>

        <CreateWorkflowDialog triggerText="Create workflow" />
      </div>

      {/* Content */}
      <div className="flex-1 py-6">
        <Suspense fallback={<UserWorkflowsSkeleton />}>
          <UserWorkflows />
        </Suspense>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Loading Skeleton */
/* ------------------------------------------------------------------ */

function UserWorkflowsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Server Component */
/* ------------------------------------------------------------------ */

async function UserWorkflows() {
  const workflows = await getWorkflowsForUser();

  /* Error state */
  if (!workflows) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Something went wrong. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  /* Empty state */
  if (workflows.length === 0) {
    return (
      <div className="flex flex-col gap-6 h-full items-center justify-center text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative rounded-full bg-gradient-to-br from-primary/20 to-primary/10 w-24 h-24 flex items-center justify-center border-4 border-primary/30">
            <InboxIcon size={48} className="stroke-primary" />
          </div>
        </div>

        <div className="space-y-2 max-w-md">
          <h3 className="text-2xl font-bold">No workflows yet</h3>
          <p className="text-muted-foreground leading-relaxed">
            Get started by creating your first automation workflow or explore our templates
          </p>
        </div>

        <div className="flex gap-3">
          <CreateWorkflowDialog triggerText="Create workflow" />
          <Button variant="outline" asChild>
            <Link href="/templates">
              Browse Templates →
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  /* Workflow list */
  return (
    <div className="space-y-3">
      {workflows.map((workflow) => (
        <WorkflowCard key={workflow.id} workflow={workflow} />
      ))}
    </div>
  );
}
