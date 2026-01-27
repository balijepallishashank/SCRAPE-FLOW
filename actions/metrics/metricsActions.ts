"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function recordExecutionMetrics(data: {
  executionId: string;
  nodeId: string;
  taskType: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  error?: string;
  memoryUsed?: number;
  cpuUsed?: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await prisma.executionMetrics.create({
    data,
  });
}

export async function getExecutionMetrics(executionId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await prisma.executionMetrics.findMany({
    where: { executionId },
    orderBy: { startTime: "asc" },
  });
}

export async function getNodePerformanceStats(taskType: string, days: number = 30) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const metrics = await prisma.executionMetrics.findMany({
    where: {
      taskType,
      startTime: { gte: since },
    },
    select: {
      duration: true,
      status: true,
      memoryUsed: true,
      cpuUsed: true,
    },
  });

  type MetricSample = {
    duration: number | null;
    status: string;
    memoryUsed: number | null;
    cpuUsed: number | null;
  };

  const typedMetrics = metrics as MetricSample[];

  if (metrics.length === 0) {
    return {
      taskType,
      count: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      successRate: 0,
      avgMemory: 0,
      avgCpu: 0,
    };
  }

  const durations = typedMetrics.map((m) => m.duration ?? 0);
  const successCount = typedMetrics.filter((m) => m.status === "SUCCESS").length;

  return {
    taskType,
    count: metrics.length,
    avgDuration: durations.length
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0,
    minDuration: durations.length ? Math.min(...durations) : 0,
    maxDuration: durations.length ? Math.max(...durations) : 0,
    successRate: metrics.length ? (successCount / metrics.length) * 100 : 0,
    avgMemory: (() => {
      const memorySamples = typedMetrics.filter((m) => m.memoryUsed !== null && m.memoryUsed !== undefined);
      if (!memorySamples.length) return 0;
      const total = memorySamples.reduce((acc: number, m) => acc + (m.memoryUsed ?? 0), 0);
      return total / memorySamples.length;
    })(),
    avgCpu: (() => {
      const cpuSamples = typedMetrics.filter((m) => m.cpuUsed !== null && m.cpuUsed !== undefined);
      if (!cpuSamples.length) return 0;
      const total = cpuSamples.reduce((acc: number, m) => acc + (m.cpuUsed ?? 0), 0);
      return total / cpuSamples.length;
    })(),
  };
}

export async function getWorkflowPerformanceMetrics(workflowId: string, days: number = 30) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  type ExecutionSummary = {
    id: string;
    duration: number | null;
    status: string;
    creditsConsumed: number;
  };

  const executions = (await prisma.workflowExecution.findMany({
    where: {
      workflowId,
      startedAt: { gte: since },
    },
    select: {
      id: true,
      duration: true,
      status: true,
      creditsConsumed: true,
    },
  })) as ExecutionSummary[];

  // Get node-level metrics for these executions
  const nodeMetrics = await prisma.executionMetrics.groupBy({
    by: ["taskType"],
    where: {
      executionId: { in: executions.map((e) => e.id) },
    },
    _avg: {
      duration: true,
    },
    _count: {
      taskType: true,
    },
  });

  return {
    totalExecutions: executions.length,
    successfulExecutions: executions.filter((e) => e.status === "COMPLETED").length,
    failedExecutions: executions.filter((e) => e.status === "FAILED").length,
    avgDuration: (() => {
      const withDuration = executions.filter((e) => typeof e.duration === "number");
      if (!withDuration.length) return 0;
      const total = withDuration.reduce((acc: number, e) => acc + (e.duration || 0), 0);
      return total / withDuration.length;
    })(),
    totalCredits: executions.reduce((a: number, e) => a + e.creditsConsumed, 0),
    nodeStats: (nodeMetrics as Array<{ taskType: string; _count: { taskType: number }; _avg: { duration: number | null } }>).map(
      (m) => ({
        taskType: m.taskType,
        count: m._count.taskType,
        avgDuration: m._avg.duration || 0,
      })
    ),
  };
}
