"use client";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, CheckCircle2Icon, ZapIcon } from "lucide-react";
import Link from "next/link";

const templates = {
  "web-scraping": {
    name: "Basic Web Scraping",
    description: "Extract text content from any website",
    category: "scraping",
    icon: "🔍",
    longDescription: "Launch a browser, navigate to a website, extract the HTML, and parse text content. Perfect for collecting data from web pages.",
    features: [
      "Launch browser instances",
      "Navigate to URLs",
      "Extract page HTML",
      "Parse text content",
      "Support for dynamic websites"
    ],
    steps: [
      { name: "Launch Browser", description: "Initialize a browser instance for web interaction" },
      { name: "Navigate to URL", description: "Go to the target website" },
      { name: "Extract HTML", description: "Get the page source code" },
      { name: "Extract Text", description: "Parse and extract text content" }
    ]
  },
  "form-automation": {
    name: "Form Automation",
    description: "Fill and submit web forms automatically",
    category: "automation",
    icon: "⚡",
    longDescription: "Automate form filling and submission. Perfect for data entry, account creation, or submitting information to web services.",
    features: [
      "Launch browser instances",
      "Fill form fields",
      "Select dropdown options",
      "Click submit buttons",
      "Handle form validation"
    ],
    steps: [
      { name: "Launch Browser", description: "Initialize a browser instance" },
      { name: "Navigate to Form", description: "Go to the form page" },
      { name: "Fill Form Fields", description: "Enter data into form inputs" },
      { name: "Click Submit", description: "Submit the form" }
    ]
  },
  "screenshot-capture": {
    name: "Screenshot Capture",
    description: "Take screenshots of web pages",
    category: "monitoring",
    icon: "👁️",
    longDescription: "Capture visual screenshots of web pages for monitoring, documentation, or comparison purposes.",
    features: [
      "Launch browser instances",
      "Wait for elements to load",
      "Capture full page screenshots",
      "Save in multiple formats",
      "Schedule periodic captures"
    ],
    steps: [
      { name: "Launch Browser", description: "Initialize a browser instance" },
      { name: "Wait for Page", description: "Wait for specific elements to load" },
      { name: "Capture Screenshot", description: "Take a screenshot of the page" },
      { name: "Save Screenshot", description: "Store the image file" }
    ]
  },
  "data-extraction-webhook": {
    name: "Extract & Deliver via Webhook",
    description: "Scrape data and send to external API",
    category: "integration",
    icon: "🔗",
    longDescription: "Extract data from websites and deliver it to external APIs or webhooks for integration with other services.",
    features: [
      "Web scraping capabilities",
      "Data extraction",
      "Webhook delivery",
      "Error handling",
      "Retry mechanisms"
    ],
    steps: [
      { name: "Launch Browser", description: "Initialize a browser instance" },
      { name: "Extract Data", description: "Extract content from the page" },
      { name: "Format Data", description: "Structure data for delivery" },
      { name: "Send via Webhook", description: "Deliver to external service" }
    ]
  },
  "conditional-scraping": {
    name: "Conditional Data Extraction",
    description: "Extract data with conditional logic",
    category: "advanced",
    icon: "🚀",
    longDescription: "Use conditional logic to extract different data based on page conditions. Perfect for complex scraping scenarios.",
    features: [
      "Conditional logic blocks",
      "Multiple execution paths",
      "Pattern matching",
      "Dynamic data extraction",
      "Error recovery"
    ],
    steps: [
      { name: "Launch Browser", description: "Initialize a browser instance" },
      { name: "Extract Data", description: "Get initial content" },
      { name: "Check Condition", description: "Evaluate conditional logic" },
      { name: "Extract Based on Condition", description: "Extract different data based on results" }
    ]
  },
  "loop-scraping": {
    name: "Loop Through Items",
    description: "Iterate over multiple elements",
    category: "advanced",
    icon: "🚀",
    longDescription: "Use loops to iterate over multiple page elements and extract data from each one. Ideal for extracting lists of items.",
    features: [
      "Loop iteration",
      "Element selection",
      "Batch processing",
      "Data aggregation",
      "Collection management"
    ],
    steps: [
      { name: "Launch Browser", description: "Initialize a browser instance" },
      { name: "Extract Items", description: "Get list of items from page" },
      { name: "For Each Loop", description: "Iterate over each item" },
      { name: "Extract Item Data", description: "Extract data from each item" }
    ]
  }
};

export default function TemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  
  const template = templates[templateId as keyof typeof templates];

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Template not found</h1>
          <Button asChild>
            <Link href="/templates">Back to Templates</Link>
          </Button>
        </div>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    scraping: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    automation: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
    monitoring: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    integration: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
    advanced: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  };

  return (
    <div className="flex flex-col flex-1 h-full space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2"
        >
          <Link href="/templates">
            <ArrowLeftIcon size={16} />
            Back to Templates
          </Link>
        </Button>
      </div>

      {/* Template Preview Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{template.icon}</div>
              <div>
                <CardTitle className="text-3xl mb-2">{template.name}</CardTitle>
                <Badge className={`${categoryColors[template.category]} border font-medium px-3 py-1`}>
                  {template.category}
                </Badge>
              </div>
            </div>
          </div>
          <CardDescription className="text-base mt-4">
            {template.longDescription}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2Icon size={20} className="text-green-600" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {template.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ZapIcon size={20} className="text-yellow-600" />
              Workflow Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {template.steps.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 border border-primary/20">
                      <span className="text-sm font-semibold text-primary">{idx + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{step.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card className="border-dashed bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Ready to use this template?</CardTitle>
          <CardDescription>
            Click the button below to create a new workflow with this template configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            size="lg"
            asChild
            className="gap-2"
          >
            <Link href={`/templates/${templateId}/create`}>
              <CheckCircle2Icon size={18} />
              Use This Template
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
          >
            <Link href="/templates">
              View Other Templates
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
