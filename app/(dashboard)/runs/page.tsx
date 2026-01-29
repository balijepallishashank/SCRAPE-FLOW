import React, { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ClockIcon } from "lucide-react";
import Link from "next/link";
import RunsListClient from "./_components/RunsListClient";
import RunsPageHeader from "./_components/RunsPageHeader";

export default async function RunsPage() {
  const { userId } = await auth();
  
  let runsCount = 0;
  
  if (userId) {
    runsCount = await prisma.workflowExecution.count({
      where: { userId },
    });
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      <RunsPageHeader runsCount={runsCount} />

      <div className="flex-1 py-6">
        <Suspense fallback={<RunsSkeleton />}>
          <RunsList />
        </Suspense>
      </div>
    </div>
  );
}

function RunsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

async function RunsList() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>You must be logged in</AlertDescription>
      </Alert>
    );
  }

  type RunStatus = "COMPLETED" | "FAILED" | "RUNNING" | "PENDING";
  type RunItem = {
    id: string;
    workflowId: string;
    duration: number | null;
    status: string;
    startedAt: Date;
    creditsConsumed: number;
    error?: string | null;
    workflow: { name: string };
  };

  const runs: RunItem[] = await prisma.workflowExecution.findMany({
    where: { userId },
    include: {
      workflow: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
    take: 50,
  });

  if (runs.length === 0) {
    return (
      <div className="flex flex-col gap-4 h-full items-center justify-center text-center">
        <div className="rounded-full bg-accent w-20 h-20 flex items-center justify-center">
          <ClockIcon size={40} className="stroke-primary" />
        </div>

        <div className="space-y-1">
          <p className="font-bold">No runs yet</p>
          <p className="text-sm text-muted-foreground">
            Execute a workflow to see its run history here
          </p>
        </div>
      </div>
    );
  }

  return <RunsListClient runs={runs} />;
}
