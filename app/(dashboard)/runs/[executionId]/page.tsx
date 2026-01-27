import React from "react";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2Icon, XCircleIcon, ClockIcon, CoinsIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import RetryExecutionBtn from "./_components/RetryExecutionBtn";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ executionId: string }>;
}) {
  const { executionId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return <div>Unauthorized</div>;
  }

  const execution = await prisma.workflowExecution.findUnique({
    where: {
      id: executionId,
      userId,
    },
    include: {
      workflow: {
        select: {
          name: true,
          id: true,
        },
      },
    },
  });

  if (!execution) {
    notFound();
  }

  const duration = execution.duration
    ? `${(execution.duration / 1000).toFixed(2)}s`
    : "N/A";

  const statusConfig: Record<string, { icon: any; color: string }> = {
    COMPLETED: {
      icon: CheckCircle2Icon,
      color: "bg-green-50 text-green-700 border-green-200",
    },
    FAILED: {
      icon: XCircleIcon,
      color: "bg-red-50 text-red-700 border-red-200",
    },
    RUNNING: {
      icon: ClockIcon,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    PENDING: {
      icon: ClockIcon,
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
  };

  const statusInfo = statusConfig[execution.status] || statusConfig.PENDING;
  const StatusIcon = statusInfo.icon;

  // Parse phases and logs
  const phases = execution.phases ? JSON.parse(execution.phases) : [];
  const logs = execution.logs ? execution.logs.split("\n") : [];

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">{execution.workflow.name}</h1>
            <Badge className={statusInfo.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {execution.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Execution ID: {execution.id}
          </p>
        </div>

        <div className="flex gap-2">
          {execution.status === "FAILED" && (
            <RetryExecutionBtn workflowId={execution.workflowId} />
          )}
          <Button asChild variant="outline">
            <Link href={`/workflow/editor/${execution.workflowId}`}>
              View Workflow
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Started At</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {new Date(execution.startedAt).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {execution.completedAt && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed At
              </CardTitle>
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {new Date(execution.completedAt).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{duration}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Credits Used
            </CardTitle>
            <CoinsIcon className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {execution.creditsConsumed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execution Phases */}
      {phases.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Execution Phases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {phases.map((phase: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 border-b pb-2 last:border-0"
                >
                  {phase.status === "completed" ? (
                    <CheckCircle2Icon className="w-5 h-5 text-green-500" />
                  ) : phase.status === "failed" ? (
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  ) : (
                    <ClockIcon className="w-5 h-5 text-yellow-500" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{phase.taskType}</p>
                    {phase.error && (
                      <p className="text-sm text-red-600">{phase.error}</p>
                    )}
                  </div>
                  {phase.creditsConsumed > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {phase.creditsConsumed} credits
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Logs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Execution Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm text-white max-h-96 overflow-auto">
              {logs.map((log: string, index: number) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No logs available</p>
          )}
        </CardContent>
      </Card>

      {/* Output */}
      {execution.output && (
        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm max-h-96 overflow-auto">
              {execution.output}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
