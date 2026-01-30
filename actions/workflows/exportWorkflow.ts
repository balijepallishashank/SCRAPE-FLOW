"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export interface WorkflowExportPayload {
  version: number;
  exportedAt: string;
  name: string;
  description?: string;
  definition: string;
}

export async function exportWorkflow(workflowId: string): Promise<WorkflowExportPayload> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const workflow = await prisma.workflow.findFirst({
    where: {
      id: workflowId,
      userId,
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    name: workflow.name,
    description: workflow.description ?? undefined,
    definition: workflow.definition,
  };
}
