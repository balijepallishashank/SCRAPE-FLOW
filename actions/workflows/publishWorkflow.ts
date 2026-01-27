"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function publishWorkflow({
  workflowId,
}: {
  workflowId: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const workflow = await prisma.workflow.findUnique({
    where: {
      id: workflowId,
      userId,
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  if (workflow.status === "PUBLISHED") {
    throw new Error("Workflow is already published");
  }

  await prisma.workflow.update({
    where: {
      id: workflowId,
      userId,
    },
    data: {
      status: "PUBLISHED",
    },
  });

  return { success: true };
}

export async function unpublishWorkflow({
  workflowId,
}: {
  workflowId: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const workflow = await prisma.workflow.findUnique({
    where: {
      id: workflowId,
      userId,
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  if (workflow.status === "DRAFT") {
    throw new Error("Workflow is already a draft");
  }

  await prisma.workflow.update({
    where: {
      id: workflowId,
      userId,
    },
    data: {
      status: "DRAFT",
    },
  });

  return { success: true };
}
