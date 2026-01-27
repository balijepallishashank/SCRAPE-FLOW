"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function UpdateWorkflow({
  id,
  definition,
}: {
  id: string;
  definition: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthenticated");
  }

  // Find workflow ensuring it belongs to the authenticated user
  const workflow = await prisma.workflow.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  // Allow updates for both draft and published workflows so autosave works post-publish.
  // Publishing should be controlled elsewhere; here we only enforce ownership.

  // Update by id (id is unique). We previously confirmed ownership.
  await prisma.workflow.update({
    where: {
      id,
    },
    data: {
      definition,
    },
  });
  revalidatePath(`/workflow/editor/${id}`);
}