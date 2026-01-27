"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function storeData(workflowId: string, key: string, value: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const storage = await prisma.workflowStorage.upsert({
    where: {
      workflowId_key: {
        workflowId,
        key,
      },
    },
    update: {
      value,
      updatedAt: new Date(),
    },
    create: {
      workflowId,
      userId,
      key,
      value,
    },
  });

  return storage;
}

export async function retrieveData(workflowId: string, key: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const storage = await prisma.workflowStorage.findUnique({
    where: {
      workflowId_key: {
        workflowId,
        key,
      },
    },
  });

  return storage?.value || null;
}

export async function getAllStorageKeys(workflowId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await prisma.workflowStorage.findMany({
    where: {
      workflowId,
      userId,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function deleteStorageKey(workflowId: string, key: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  await prisma.workflowStorage.delete({
    where: {
      workflowId_key: {
        workflowId,
        key,
      },
    },
  });

  revalidatePath(`/workflow/editor/${workflowId}`);
}
