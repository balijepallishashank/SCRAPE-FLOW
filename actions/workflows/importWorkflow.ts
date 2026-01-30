"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { WorkflowStatus } from "@/types/workflow";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const importSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(200).optional().or(z.literal("")),
  definition: z.union([z.string(), z.record(z.string(), z.any())]),
});

export async function importWorkflow(payload: unknown) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const parsed = importSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Invalid workflow export file");
  }

  const { name, description } = parsed.data;
  let { definition } = parsed.data;

  if (typeof definition !== "string") {
    definition = JSON.stringify(definition);
  }

  try {
    JSON.parse(definition);
  } catch {
    throw new Error("Workflow definition is not valid JSON");
  }

  const created = await prisma.workflow.create({
    data: {
      userId,
      name,
      description: description || undefined,
      status: WorkflowStatus.DRAFT,
      definition,
    },
  });

  revalidatePath("/workflows");

  return created.id;
}
