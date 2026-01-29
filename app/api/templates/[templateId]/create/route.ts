import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { definition } = body;

    if (!definition) {
      return NextResponse.json(
        { error: "Definition is required" },
        { status: 400 }
      );
    }

    // Template names mapping
    const templateNames: Record<string, string> = {
      "web-scraping": "Basic Web Scraping",
      "form-automation": "Form Automation",
      "screenshot-capture": "Screenshot Capture",
      "data-extraction-webhook": "Extract & Deliver via Webhook",
      "conditional-scraping": "Conditional Data Extraction",
      "loop-scraping": "Loop Through Items",
    };

    const templateDescriptions: Record<string, string> = {
      "web-scraping": "Extract text content from any website",
      "form-automation": "Fill and submit web forms automatically",
      "screenshot-capture": "Take screenshots of web pages",
      "data-extraction-webhook": "Scrape data and send to external API",
      "conditional-scraping": "Extract data with conditional logic",
      "loop-scraping": "Iterate over multiple elements",
    };

    // Add timestamp to make name unique
    const timestamp = new Date().getTime();
    const workflowName = `${templateNames[templateId] || "New Workflow"} - Copy ${timestamp}`;

    const workflow = await prisma.workflow.create({
      data: {
        userId,
        name: workflowName,
        definition: JSON.stringify(definition),
        description: templateDescriptions[templateId] || "",
        status: "DRAFT",
      },
    });

    return NextResponse.json({
      success: true,
      workflowId: workflow.id,
    });
  } catch (error) {
    console.error("Error creating workflow from template:", error);
    return NextResponse.json(
      { error: "Failed to create workflow from template" },
      { status: 500 }
    );
  }
}
