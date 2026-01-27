"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { TaskRegistry } from "@/lib/workflow/task/registry";

export async function getCreditUsageData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Get user balance
  const userBalance = await prisma.userBalance.findUnique({
    where: { userId },
    select: { credits: true },
  });

  if (!userBalance) throw new Error("User balance not found");

  // Get all workflow executions with phases
  const executions = await prisma.workflowExecution.findMany({
    where: {
      workflow: {
        userId,
      },
      status: "COMPLETED",
      completedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      completedAt: "desc",
    },
  });

  // Calculate total credits used
  let totalUsed = 0;
  const byWorkflow: Record<string, { name: string; credits: number }> = {};
  const byTask: Record<string, { credits: number; count: number }> = {};
  const byDate: Record<string, number> = {};

  for (const execution of executions) {
    const executionCredits = execution.creditsConsumed || 0;
    totalUsed += executionCredits;

    // By workflow
    if (!byWorkflow[execution.workflowId]) {
      byWorkflow[execution.workflowId] = {
        name: execution.workflow.name,
        credits: 0,
      };
    }
    byWorkflow[execution.workflowId].credits += executionCredits;

    // By task type (phases stored as JSON array)
    const phaseList: Array<{ name: string }> = (() => {
      if (!execution.phases) return [];
      try {
        const parsed = JSON.parse(execution.phases);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();

    for (const phase of phaseList) {
      const taskType = phase.name;
      if (!byTask[taskType]) {
        byTask[taskType] = { credits: 0, count: 0 };
      }
      // Estimate credits per task based on registry
      const task = TaskRegistry[taskType as keyof typeof TaskRegistry];
      const taskCredits = task?.credits ?? 0;
      byTask[taskType].credits += taskCredits;
      byTask[taskType].count += 1;
    }

    // By date
    const date = execution.completedAt
      ? new Date(execution.completedAt).toLocaleDateString()
      : new Date().toLocaleDateString();
    byDate[date] = (byDate[date] || 0) + executionCredits;
  }

  return {
    totalCredits: userBalance.credits + totalUsed, // Total ever had
    usedCredits: totalUsed,
    remainingCredits: userBalance.credits,
    byWorkflow: Object.entries(byWorkflow)
      .map(([id, data]) => ({
        workflowId: id,
        workflowName: data.name,
        creditsUsed: data.credits,
      }))
      .sort((a, b) => b.creditsUsed - a.creditsUsed)
      .slice(0, 10),
    byTask: Object.entries(byTask)
      .map(([taskType, data]) => ({
        taskType,
        creditsUsed: data.credits,
        executionCount: data.count,
      }))
      .sort((a, b) => b.creditsUsed - a.creditsUsed)
      .slice(0, 10),
    timeline: Object.entries(byDate)
      .map(([date, credits]) => ({
        date,
        creditsUsed: credits,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  };
}
