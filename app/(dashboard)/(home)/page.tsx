import React, { Suspense } from "react";
import { getWorkflowsForUser } from "@/actions/workflows/getWorkflowsForUser";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Zap, FileText, TrendingUp } from "lucide-react";
import Link from "next/link";
import CreateWorkflowDialog from "../workflows/_components/CreateWorkflowDialog";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1 h-full gap-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">Welcome back 👋</h1>
        <p className="text-muted-foreground text-lg">
          Here's what's happening with your workflows
        </p>
      </div>

      {/* Stats Overview */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <CreateWorkflowDialog triggerText="+ Create Workflow" />
        <Button variant="outline" asChild>
          <Link href="/workflows">View All Workflows →</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/runs">View Runs →</Link>
        </Button>
      </div>

      {/* Recent Activity */}
      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
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

  const workflows = await getWorkflowsForUser();
  const activeWorkflows = workflows?.filter((w) => w.status === "PUBLISHED") || [];
  
  const runsToday = await prisma.workflowExecution.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
    select: { id: true },
  });

  const userBalance = await prisma.userBalance.findFirst({
    where: { userId },
  });

  const stats = [
    {
      title: "Total Workflows",
      value: workflows?.length || 0,
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Active Workflows",
      value: activeWorkflows.length,
      icon: Zap,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      title: "Runs Today",
      value: runsToday.length,
      icon: Activity,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      title: "Credits Remaining",
      value: userBalance?.credits || 0,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`${stat.color} w-6 h-6`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

async function RecentActivity() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const recentRuns = await prisma.workflowExecution.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      workflow: {
        select: { name: true },
      },
    },
  });

  if (recentRuns.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No workflow runs yet. Create and execute your first workflow to see activity here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600 bg-green-50 dark:bg-green-950/30";
      case "RUNNING":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950/30";
      case "FAILED":
        return "text-red-600 bg-red-50 dark:bg-red-950/30";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-950/30";
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentRuns.map((run) => (
            <div
              key={run.id}
              className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex-1">
                <p className="font-medium">{run.workflow.name}</p>
                <p className="text-sm text-muted-foreground">
                  {getTimeAgo(run.createdAt)}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                  run.status
                )}`}
              >
                {run.status}
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="ml-2"
              >
                <Link href={`/runs/${run.id}`}>View →</Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-6 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
