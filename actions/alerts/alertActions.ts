"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { fetchWithRetry } from "@/lib/http";

export async function getAlertConfig(workflowId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return await prisma.alertConfig.findUnique({
    where: { workflowId },
  });
}

export async function updateAlertConfig(params: {
  workflowId: string;
  enabled: boolean;
  onSuccess: boolean;
  onFailure: boolean;
  emailEnabled: boolean;
  email?: string;
  webhookEnabled: boolean;
  webhookUrl?: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const alertConfig = await prisma.alertConfig.upsert({
    where: { workflowId: params.workflowId },
    update: {
      enabled: params.enabled,
      onSuccess: params.onSuccess,
      onFailure: params.onFailure,
      emailEnabled: params.emailEnabled,
      email: params.email,
      webhookEnabled: params.webhookEnabled,
      webhookUrl: params.webhookUrl,
    },
    create: {
      workflowId: params.workflowId,
      userId,
      enabled: params.enabled,
      onSuccess: params.onSuccess,
      onFailure: params.onFailure,
      emailEnabled: params.emailEnabled,
      email: params.email,
      webhookEnabled: params.webhookEnabled,
      webhookUrl: params.webhookUrl,
    },
  });

  revalidatePath(`/workflow/editor/${params.workflowId}`);

  return alertConfig;
}

export async function sendAlert(params: {
  workflowId: string;
  status: "success" | "failure";
  workflowName: string;
  executionId: string;
  error?: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    return;
  }

  const config = await getAlertConfig(params.workflowId);

  if (!config || !config.enabled) {
    return;
  }

  // Check if alert should be sent for this status
  if (params.status === "success" && !config.onSuccess) {
    return;
  }
  if (params.status === "failure" && !config.onFailure) {
    return;
  }

  // Send email notification
  if (config.emailEnabled && config.email) {
    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    console.log(`[EMAIL ALERT] Sending to ${config.email}:`, params);
  }

  // Send webhook notification
  if (config.webhookEnabled && config.webhookUrl) {
    try {
      await fetchWithRetry(config.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowId: params.workflowId,
          workflowName: params.workflowName,
          executionId: params.executionId,
          status: params.status,
          error: params.error,
          timestamp: new Date().toISOString(),
        }),
        timeoutMs: Number(process.env.WEBHOOK_TIMEOUT_MS ?? 10000),
        retries: Number(process.env.WEBHOOK_RETRIES ?? 2),
        backoffMs: Number(process.env.WEBHOOK_BACKOFF_MS ?? 500),
      });
    } catch (error) {
      console.error("Failed to send webhook alert:", error);
    }
  }
}
