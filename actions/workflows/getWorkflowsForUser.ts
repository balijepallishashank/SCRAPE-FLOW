import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function getWorkflowsForUser() {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  return prisma.workflow.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}