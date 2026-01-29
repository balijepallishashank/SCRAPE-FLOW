"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function useTemplateWorkflow(templateId: string, templateDefinition: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Parse the template definition
    const definition = JSON.parse(templateDefinition);

    // Create a new workflow from the template
    const workflow = await prisma.workflow.create({
      data: {
        userId,
        name: `${getTemplateName(templateId)} - Copy`,
        definition: JSON.stringify(definition),
        description: getTemplateDescription(templateId),
        status: "DRAFT",
      },
    });

    return {
      success: true,
      workflowId: workflow.id,
    };
  } catch (error) {
    console.error("Error creating workflow from template:", error);
    throw new Error("Failed to create workflow from template");
  }
}

function getTemplateName(templateId: string): string {
  const names: Record<string, string> = {
    "web-scraping": "Basic Web Scraping",
    "form-automation": "Form Automation",
    "screenshot-capture": "Screenshot Capture",
    "data-extraction-webhook": "Extract & Deliver via Webhook",
    "conditional-scraping": "Conditional Data Extraction",
    "loop-scraping": "Loop Through Items",
  };
  return names[templateId] || "New Workflow";
}

function getTemplateDescription(templateId: string): string {
  const descriptions: Record<string, string> = {
    "web-scraping": "Extract text content from any website",
    "form-automation": "Fill and submit web forms automatically",
    "screenshot-capture": "Take screenshots of web pages",
    "data-extraction-webhook": "Scrape data and send to external API",
    "conditional-scraping": "Extract data with conditional logic",
    "loop-scraping": "Iterate over multiple elements",
  };
  return descriptions[templateId] || "";
}
