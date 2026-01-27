"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function duplicateWorkflow(workflowId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const original = await prisma.workflow.findUnique({
    where: {
      id: workflowId,
      userId,
    },
  });

  if (!original) {
    throw new Error("Workflow not found");
  }

  const duplicate = await prisma.workflow.create({
    data: {
      userId,
      name: `${original.name} (Copy)`,
      description: original.description,
      definition: original.definition,
      status: "DRAFT",
    },
  });

  revalidatePath("/workflows");

  return duplicate;
}
