import React, { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { LayoutTemplateIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { CreateFlowNode } from "@/lib/workflow/createFlowNode";
import { TaskType } from "@/types/task";

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

  const categoryColors: Record<string, string> = {
    scraping: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    automation: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
    monitoring: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    integration: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
    advanced: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  };

  const categoryIcons: Record<string, string> = {
    scraping: "🔍",
    automation: "⚡",
    monitoring: "👁️",
    integration: "🔗",
    advanced: "🚀",
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <Card 
          key={template.id} 
          className="group relative border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 bg-card/50 backdrop-blur overflow-hidden"
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <CardHeader className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <LayoutTemplateIcon className="h-6 w-6 text-primary" />
              </div>
              <Badge className={`${categoryColors[template.category]} border font-medium px-2.5 py-1`}>
                <span className="mr-1">{categoryIcons[template.category]}</span>
                {template.category}
              </Badge>
            </div>
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
              {template.name}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {template.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <Button 
              asChild 
              className="w-full shadow-sm hover:shadow-md transition-all group/btn"
            >
              <Link
                href={`/workflows?template=${template.id}&definition=${encodeURIComponent(template.definition)}`}
              >
                <PlusIcon size={16} className="mr-2 group-hover/btn:rotate-90 transition-transform" />
                Use Template
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
