import React, { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateFlowNode } from "@/lib/workflow/createFlowNode";
import { TaskType } from "@/types/task";
import { TemplatesListClient } from "./TemplatesListClient";

export default function TemplatesPage() {
  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Templates</h1>
          <p className="text-muted-foreground">
            Start with pre-built workflows
          </p>
        </div>
      </div>

      <div className="flex-1 py-6">
        <Suspense fallback={<TemplatesSkeleton />}>
          <TemplatesList />
        </Suspense>
      </div>
    </div>
  );
}

function TemplatesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function TemplatesList() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Unauthorized</div>;
  }

  // Built-in templates
  const templates = [
    {
      id: "web-scraping",
      name: "Basic Web Scraping",
      description: "Extract text content from any website",
      category: "scraping",
      definition: JSON.stringify({
        nodes: [
          CreateFlowNode(TaskType.LAUNCH_BROWSER),
          {
            ...CreateFlowNode(TaskType.PAGE_TO_HTML),
            position: { x: 300, y: 100 },
          },
          {
            ...CreateFlowNode(TaskType.EXTRACT_TEXT),
            position: { x: 600, y: 100 },
          },
        ],
        edges: [],
      }),
    },
    {
      id: "form-automation",
      name: "Form Automation",
      description: "Fill and submit web forms automatically",
      category: "automation",
      definition: JSON.stringify({
        nodes: [
          CreateFlowNode(TaskType.LAUNCH_BROWSER),
          {
            ...CreateFlowNode(TaskType.FILL_FORM),
            position: { x: 300, y: 100 },
          },
          {
            ...CreateFlowNode(TaskType.CLICK_ELEMENT),
            position: { x: 600, y: 100 },
          },
        ],
        edges: [],
      }),
    },
    {
      id: "screenshot-capture",
      name: "Screenshot Capture",
      description: "Take screenshots of web pages",
      category: "monitoring",
      definition: JSON.stringify({
        nodes: [
          CreateFlowNode(TaskType.LAUNCH_BROWSER),
          {
            ...CreateFlowNode(TaskType.WAIT_FOR_ELEMENT),
            position: { x: 300, y: 100 },
          },
          {
            ...CreateFlowNode(TaskType.SCREENSHOT),
            position: { x: 600, y: 100 },
          },
        ],
        edges: [],
      }),
    },
    {
      id: "data-extraction-webhook",
      name: "Extract & Deliver via Webhook",
      description: "Scrape data and send to external API",
      category: "integration",
      definition: JSON.stringify({
        nodes: [
          CreateFlowNode(TaskType.LAUNCH_BROWSER),
          {
            ...CreateFlowNode(TaskType.EXTRACT_TEXT),
            position: { x: 300, y: 100 },
          },
          {
            ...CreateFlowNode(TaskType.DELIVER_VIA_WEBHOOK),
            position: { x: 600, y: 100 },
          },
        ],
        edges: [],
      }),
    },
    {
      id: "conditional-scraping",
      name: "Conditional Data Extraction",
      description: "Extract data with conditional logic",
      category: "advanced",
      definition: JSON.stringify({
        nodes: [
          CreateFlowNode(TaskType.LAUNCH_BROWSER),
          {
            ...CreateFlowNode(TaskType.EXTRACT_TEXT),
            position: { x: 300, y: 100 },
          },
          {
            ...CreateFlowNode(TaskType.IF_CONDITION),
            position: { x: 600, y: 100 },
          },
        ],
        edges: [],
      }),
    },
    {
      id: "loop-scraping",
      name: "Loop Through Items",
      description: "Iterate over multiple elements",
      category: "advanced",
      definition: JSON.stringify({
        nodes: [
          CreateFlowNode(TaskType.LAUNCH_BROWSER),
          {
            ...CreateFlowNode(TaskType.EXTRACT_TEXT),
            position: { x: 300, y: 100 },
          },
          {
            ...CreateFlowNode(TaskType.FOR_EACH_LOOP),
            position: { x: 600, y: 100 },
          },
        ],
        edges: [],
      }),
    },
  ];

  return <TemplatesListClient templates={templates} />;
}
