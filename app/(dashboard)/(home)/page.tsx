import React, { Suspense } from "react";
import { getWorkflowsForUser } from "@/actions/workflows/getWorkflowsForUser";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CreateWorkflowDialog from "../workflows/_components/CreateWorkflowDialog";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { ChartsClient } from "./_components/ChartsClient";

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1 h-full gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Home</h1>
        <div className="flex items-center gap-2">
          <CreateWorkflowDialog triggerText="Create workflow" />
          <Button variant="outline" asChild>
            <Link href="/runs">View runs</Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* Charts */}
      <Suspense fallback={<ChartsSkeleton />}>
        <ChartsSection />
      </Suspense>

      {/* Recent Runs */}
      <Suspense fallback={<RecentRunsSkeleton />}>
        <RecentRunsTable />
      </Suspense>
    </div>
  );
}

/* ================================================================== */
/* COMPONENTS */
/* ================================================================== */

async function StatsCards() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const allRuns = await prisma.workflowExecution.findMany({
    where: { userId },
  });

  const workflows = await getWorkflowsForUser();
  const activeWorkflows = workflows?.filter((w) => w.status === "PUBLISHED") || [];
  const failedRuns = allRuns.filter((run) => run.status === "FAILED").length;

  let totalPhases = 0;
  let totalCreditsConsumed = 0;

  allRuns.forEach((run) => {
    if (run.phases) {
      try {
        const phases = JSON.parse(run.phases);
        totalPhases += Array.isArray(phases) ? phases.length : 0;
      } catch {}
    }
    totalCreditsConsumed += run.creditsConsumed || 0;
  });

  const userBalance = await prisma.userBalance.findFirst({
    where: { userId },
  });

  const creditsRemaining = userBalance?.credits ?? 0;
  const creditsWarningThreshold = 200;

  const stats = [
    {
      title: "Workflow executions",
      value: allRuns.length,
      color: "text-green-600",
    },
    {
      title: "Phase executions",
      value: totalPhases,
      color: "text-green-600",
    },
    {
      title: "Credits consumed",
      value: totalCreditsConsumed,
      color: "text-green-600",
    },
    {
      title: "Credits remaining",
      value: creditsRemaining,
      color: creditsRemaining <= creditsWarningThreshold ? "text-red-600" : "text-green-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border border-neutral-200 dark:border-neutral-800">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                {stat.title}
              </p>
              <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
              {stat.title === "Credits remaining" && creditsRemaining <= creditsWarningThreshold && (
                <p className="mt-2 text-xs text-red-600">
                  Low balance — top up to avoid interruptions.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="rounded-full border border-neutral-200 dark:border-neutral-800 px-3 py-1 text-sm">
          Active workflows: <span className="font-semibold">{activeWorkflows.length}</span>
        </div>
        <div className="rounded-full border border-neutral-200 dark:border-neutral-800 px-3 py-1 text-sm">
          Failed runs: <span className="font-semibold">{failedRuns}</span>
        </div>
      </div>
    </div>
  );
}

async function ChartsSection() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const runs = await prisma.workflowExecution.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const executionStatusData = generateExecutionStatusData(runs);
  const dailyCreditsData = generateDailyCreditsData(runs);

  return (
    <ChartsClient executionStatusData={executionStatusData} dailyCreditsData={dailyCreditsData} />
  );
}

function generateExecutionStatusData(runs: any[]) {
  const dailyData: Record<string, { Success: number; Failed: number }> = {};
  const monthKeys: Record<string, string> = {};

  runs.forEach((run) => {
    const createdAt = new Date(run.createdAt);
    const date = createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = createdAt.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (!dailyData[date]) {
      dailyData[date] = { Success: 0, Failed: 0 };
      monthKeys[date] = JSON.stringify({ monthKey, monthLabel });
    }

    if (run.status === "COMPLETED") {
      dailyData[date].Success += 1;
    } else if (run.status === "FAILED") {
      dailyData[date].Failed += 1;
    }
  });

  return Object.entries(dailyData).map(([date, data]) => {
    const { monthKey, monthLabel } = JSON.parse(monthKeys[date]);
    return {
      date,
      monthKey,
      monthLabel,
      ...data,
    };
  });
}

function generateDailyCreditsData(runs: any[]) {
  const dailyData: Record<string, { "Successful Phases Credits": number; "Failed Phases Credits": number }> = {};
  const monthKeys: Record<string, string> = {};

  runs.forEach((run) => {
    const createdAt = new Date(run.createdAt);
    const date = createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = createdAt.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (!dailyData[date]) {
      dailyData[date] = { "Successful Phases Credits": 0, "Failed Phases Credits": 0 };
      monthKeys[date] = JSON.stringify({ monthKey, monthLabel });
    }

    if (run.status === "COMPLETED") {
      dailyData[date]["Successful Phases Credits"] += run.creditsConsumed || 0;
    } else if (run.status === "FAILED") {
      dailyData[date]["Failed Phases Credits"] += run.creditsConsumed || 0;
    }
  });

  return Object.entries(dailyData).map(([date, data]) => {
    const { monthKey, monthLabel } = JSON.parse(monthKeys[date]);
    return {
      date,
      monthKey,
      monthLabel,
      ...data,
    };
  });
}

async function RecentRunsTable() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const recentRuns = await prisma.workflowExecution.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      workflow: {
        select: { name: true },
      },
    },
  });

  return (
    <Card className="border border-neutral-200 dark:border-neutral-800">
      <CardHeader>
        <CardTitle>Recent runs</CardTitle>
      </CardHeader>
      <CardContent>
        {recentRuns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No runs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-neutral-200 dark:border-neutral-800">
                  <th className="py-2">Workflow</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Credits</th>
                  <th className="py-2">Date</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((run) => (
                  <tr key={run.id} className="border-b border-neutral-200/60 dark:border-neutral-800/60">
                    <td className="py-2 font-medium">{run.workflow?.name ?? "Workflow"}</td>
                    <td className="py-2 capitalize">{run.status.toLowerCase()}</td>
                    <td className="py-2">{run.creditsConsumed}</td>
                    <td className="py-2">{new Date(run.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/runs/${run.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6">
            <Skeleton className="h-4 w-2/3 mb-3" />
            <Skeleton className="h-10 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
      <Card className="border border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function RecentRunsSkeleton() {
  return (
    <Card className="border border-neutral-200 dark:border-neutral-800">
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-36 w-full" />
      </CardContent>
    </Card>
  );
}
