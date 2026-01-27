"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createVersion(workflowId: string, changeMessage?: string) {
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

  // Get latest version number
  const latestVersion = await prisma.workflowVersion.findFirst({
    where: { workflowId },
    orderBy: { version: "desc" },
  });

  const newVersion = (latestVersion?.version || 0) + 1;

  const version = await prisma.workflowVersion.create({
    data: {
      workflowId,
      userId,
      version: newVersion,
      definition: workflow.definition,
      changeMessage,
    },
  });

  revalidatePath(`/workflow/editor/${workflowId}`);

  return version;
}

export async function getVersionHistory(workflowId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await prisma.workflowVersion.findMany({
    where: { workflowId, userId },
    orderBy: { version: "desc" },
    take: 50,
  });
}

export async function restoreVersion(workflowId: string, versionId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const version = await prisma.workflowVersion.findUnique({
    where: { id: versionId },
  });

  if (!version || version.userId !== userId) {
    throw new Error("Version not found");
  }

  // Update workflow with version's definition
  await prisma.workflow.update({
    where: { id: workflowId, userId },
    data: {
      definition: version.definition,
    },
  });

  // Create new version as "Restored from v{X}"
  await createVersion(workflowId, `Restored from v${version.version}`);

  revalidatePath(`/workflow/editor/${workflowId}`);
}
