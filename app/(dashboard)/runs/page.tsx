import React, { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ClockIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function RunsPage() {
  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Runs</h1>
          <p className="text-muted-foreground">
            View execution history and logs
          </p>
        </div>
      </div>

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

  return (
    <div className="space-y-3">
      {runs.map((run) => {
        const duration = run.duration
          ? `${(run.duration / 1000).toFixed(1)}s`
          : "N/A";

        const STATUS_CONFIG: Record<RunStatus, { bg: string; text: string; border: string; icon: string }> = {
          COMPLETED: { 
            bg: "bg-green-500/10", 
            text: "text-green-600 dark:text-green-400", 
            border: "border-green-500/30",
            icon: "✓"
          },
          FAILED: { 
            bg: "bg-red-500/10", 
            text: "text-red-600 dark:text-red-400", 
            border: "border-red-500/30",
            icon: "✕"
          },
          RUNNING: { 
            bg: "bg-blue-500/10", 
            text: "text-blue-600 dark:text-blue-400", 
            border: "border-blue-500/30",
            icon: "↻"
          },
          PENDING: { 
            bg: "bg-yellow-500/10", 
            text: "text-yellow-600 dark:text-yellow-400", 
            border: "border-yellow-500/30",
            icon: "⏱"
          },
        };

        const config = STATUS_CONFIG[run.status as RunStatus] || STATUS_CONFIG.PENDING;

        return (
          <Card key={run.id} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-card/50 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/runs/${run.id}`}
                      className="text-lg font-bold hover:text-primary transition-colors group-hover:underline"
                    >
                      {run.workflow.name}
                    </Link>
                    <Badge 
                      className={`${config.bg} ${config.text} ${config.border} border font-medium px-2.5 py-0.5`}
                    >
                      <span className="mr-1.5">{config.icon}</span>
                      {run.status as RunStatus}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <ClockIcon size={14} />
                      <span>{new Date(run.startedAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">Duration:</span>
                      <span>{duration}</span>
                    </div>
                    {run.creditsConsumed > 0 && (
                      <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
                        <span className="font-medium">Credits:</span>
                        <span className="font-bold">{run.creditsConsumed}</span>
                      </div>
                    )}
                  </div>

                  {run.status === "FAILED" && run.error && (
                    <div className="mt-2 p-2 rounded bg-red-500/5 border border-red-500/20">
                      <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                        {run.error}
                      </p>
                    </div>
                  )}
                </div>

                <Link
                  href={`/runs/${run.id}`}
                  className="shrink-0 px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-all hover:shadow-md"
                >
                  View Details →
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
