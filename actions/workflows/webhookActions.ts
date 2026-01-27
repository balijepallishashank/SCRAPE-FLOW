"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

export async function createWebhook(workflowId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId, userId },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  // Check if webhook already exists
  const existing = await prisma.webhookTrigger.findFirst({
    where: { workflowId, userId },
  });

  if (existing) {
    return existing;
  }

  // Create unique webhook path
  const webhookPath = nanoid(16);

  const webhook = await prisma.webhookTrigger.create({
    data: {
      workflowId,
      userId,
      webhookPath,
      enabled: true,
    },
  });

  revalidatePath(`/workflow/editor/${workflowId}`);

  return webhook;
}

export async function getWebhook(workflowId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await prisma.webhookTrigger.findFirst({
    where: { workflowId, userId },
  });
}

export async function toggleWebhook(webhookId: string, enabled: boolean) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const webhook = await prisma.webhookTrigger.update({
    where: { id: webhookId },
    data: { enabled },
  });

  revalidatePath(`/workflow/editor/${webhook.workflowId}`);

  return webhook;
}

export async function deleteWebhook(webhookId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const webhook = await prisma.webhookTrigger.findUnique({
    where: { id: webhookId },
  });

  if (!webhook || webhook.userId !== userId) {
    throw new Error("Webhook not found");
  }

  await prisma.webhookTrigger.delete({
    where: { id: webhookId },
  });

  revalidatePath(`/workflow/editor/${webhook.workflowId}`);
}
