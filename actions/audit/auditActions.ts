"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function logAudit(params: {
  action: string;
  entityType: string;
  entityId?: string;
  workflowId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    return; // Silent fail for audit logs
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        workflowId: params.workflowId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
}

export async function getAuditLogs(workflowId?: string, limit = 100) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await prisma.auditLog.findMany({
    where: {
      userId,
      ...(workflowId && { workflowId }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
