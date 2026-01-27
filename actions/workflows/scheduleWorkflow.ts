"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createSchedule({
  workflowId,
  cronExpression,
  timezone = "UTC",
}: {
  workflowId: string;
  cronExpression: string;
  timezone?: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  // Verify workflow exists and belongs to user
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: workflowId,
      userId,
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  // Create schedule
  const schedule = await prisma.workflowSchedule.create({
    data: {
      workflowId,
      userId,
      cronExpression,
      timezone,
      enabled: true,
    },
  });

  revalidatePath(`/workflow/editor/${workflowId}`);
  return schedule;
}

export async function updateSchedule({
  scheduleId,
  enabled,
  cronExpression,
  timezone,
}: {
  scheduleId: string;
  enabled?: boolean;
  cronExpression?: string;
  timezone?: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  // Verify schedule belongs to user
  const schedule = await prisma.workflowSchedule.findFirst({
    where: {
      id: scheduleId,
      userId,
    },
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  const updated = await prisma.workflowSchedule.update({
    where: { id: scheduleId },
    data: {
      ...(enabled !== undefined && { enabled }),
      ...(cronExpression && { cronExpression }),
      ...(timezone && { timezone }),
    },
  });

  revalidatePath(`/workflow/editor/${schedule.workflowId}`);
  return updated;
}

export async function deleteSchedule(scheduleId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const schedule = await prisma.workflowSchedule.findFirst({
    where: {
      id: scheduleId,
      userId,
    },
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  await prisma.workflowSchedule.delete({
    where: { id: scheduleId },
  });

  revalidatePath(`/workflow/editor/${schedule.workflowId}`);
}

export async function getSchedulesForWorkflow(workflowId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  return await prisma.workflowSchedule.findMany({
    where: {
      workflowId,
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
