"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

export async function shareWorkflow(data: {
  workflowId: string;
  shareType: "ORGANIZATION" | "PUBLIC" | "PRIVATE";
  orgId?: string;
  allowExecution?: boolean;
  allowClone?: boolean;
  allowEdit?: boolean;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify workflow ownership
  const workflow = await prisma.workflow.findUnique({
    where: { id: data.workflowId },
  });

  if (!workflow || workflow.userId !== userId) {
    throw new Error("Workflow not found or you don't have permission");
  }

  const publicUrl = data.shareType === "PUBLIC" ? nanoid(12) : null;

  const shared = await prisma.sharedWorkflow.upsert({
    where: { workflowId: data.workflowId },
    update: {
      shareType: data.shareType,
      orgId: data.orgId,
      publicUrl,
      allowExecution: data.allowExecution ?? true,
      allowClone: data.allowClone ?? true,
      allowEdit: data.allowEdit ?? false,
    },
    create: {
      workflowId: data.workflowId,
      shareType: data.shareType,
      orgId: data.orgId,
      publicUrl,
      allowExecution: data.allowExecution ?? true,
      allowClone: data.allowClone ?? true,
      allowEdit: data.allowEdit ?? false,
    },
  });

  revalidatePath(`/workflow/editor/${data.workflowId}`);
  return shared;
}

export async function getSharedWorkflow(publicUrl: string) {
  const shared = await prisma.sharedWorkflow.findUnique({
    where: { publicUrl },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!shared) {
    throw new Error("Shared workflow not found");
  }

  // Increment view count
  await prisma.sharedWorkflow.update({
    where: { id: shared.id },
    data: { viewCount: { increment: 1 } },
  });

  // Get workflow details
  const workflow = await prisma.workflow.findUnique({
    where: { id: shared.workflowId },
    select: {
      id: true,
      name: true,
      description: true,
      definition: true,
      status: true,
    },
  });

  return { shared, workflow };
}

export async function cloneSharedWorkflow(publicUrl: string, newName: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const shared = await prisma.sharedWorkflow.findUnique({
    where: { publicUrl },
  });

  if (!shared || !shared.allowClone) {
    throw new Error("Workflow cannot be cloned");
  }

  const originalWorkflow = await prisma.workflow.findUnique({
    where: { id: shared.workflowId },
  });

  if (!originalWorkflow) {
    throw new Error("Original workflow not found");
  }

  // Create clone
  const cloned = await prisma.workflow.create({
    data: {
      userId,
      name: newName,
      description: `Cloned from: ${originalWorkflow.name}`,
      definition: originalWorkflow.definition,
      status: "DRAFT",
    },
  });

  // Increment clone count
  await prisma.sharedWorkflow.update({
    where: { id: shared.id },
    data: { cloneCount: { increment: 1 } },
  });

  revalidatePath("/workflows");
  return cloned;
}

export async function unshareWorkflow(workflowId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify workflow ownership
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });

  if (!workflow || workflow.userId !== userId) {
    throw new Error("Workflow not found or you don't have permission");
  }

  await prisma.sharedWorkflow.delete({
    where: { workflowId },
  });

  revalidatePath(`/workflow/editor/${workflowId}`);
}

export async function getWorkflowShareInfo(workflowId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const shared = await prisma.sharedWorkflow.findUnique({
    where: { workflowId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return shared;
}
