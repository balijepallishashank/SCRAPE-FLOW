import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { executeWorkflow } from "@/actions/workflows/executeWorkflow";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ webhookPath: string }> }
) {
  try {
    const { webhookPath } = await params;

    // Find webhook
    const webhook = await prisma.webhookTrigger.findUnique({
      where: {
        webhookPath,
        enabled: true,
      },
      include: {
        workflow: true,
      },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: "Webhook not found or disabled" },
        { status: 404 }
      );
    }

    // Get request body (if any)
    let body = null;
    try {
      body = await request.json();
    } catch {
      // No body or invalid JSON
    }

    // Update webhook stats
    await prisma.webhookTrigger.update({
      where: { id: webhook.id },
      data: {
        lastTriggeredAt: new Date(),
        triggerCount: webhook.triggerCount + 1,
      },
    });

    // Execute workflow asynchronously
    executeWorkflow(webhook.workflowId).catch((error) => {
      console.error("Webhook execution failed:", error);
    });

    return NextResponse.json({
      success: true,
      message: "Workflow execution triggered",
      workflowId: webhook.workflowId,
      webhookData: body,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ webhookPath: string }> }
) {
  const { webhookPath } = await params;

  const webhook = await prisma.webhookTrigger.findUnique({
    where: { webhookPath },
    include: {
      workflow: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  return NextResponse.json({
    workflowName: webhook.workflow.name,
    enabled: webhook.enabled,
    triggerCount: webhook.triggerCount,
    lastTriggeredAt: webhook.lastTriggeredAt,
  });
}
