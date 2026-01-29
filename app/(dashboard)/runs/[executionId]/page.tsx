import React from "react";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import RunDetailClient from "./_components/RunDetailClient";

async function RunDetailPageContent({
  executionId,
}: {
  executionId: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    return <div>Unauthorized</div>;
  }

  const execution = await prisma.workflowExecution.findUnique({
    where: {
      id: executionId,
      userId,
    },
    include: {
      workflow: {
        select: {
          name: true,
          id: true,
        },
      },
    },
  });

  if (!execution) {
    notFound();
  }

  const executionData = {
    ...execution,
    startedAt: execution.startedAt || new Date(),
    completedAt: execution.completedAt,
  };

  return <RunDetailClient execution={executionData} />;
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ executionId: string }>;
}) {
  const { executionId } = await params;
  return <RunDetailPageContent executionId={executionId} />;
}