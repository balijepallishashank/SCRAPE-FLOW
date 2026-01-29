"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutTemplateIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  definition: string;
}

interface TemplateCardProps {
  template: Template;
  categoryColors: Record<string, string>;
  categoryIcons: Record<string, string>;
}

function TemplateCard({ template, categoryColors, categoryIcons }: TemplateCardProps) {
  return (
    <Card 
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
      <CardContent className="relative flex gap-2">
        <Button 
          asChild
          className="flex-1 shadow-sm hover:shadow-md transition-all group/btn"
        >
          <Link href={`/templates/${template.id}/create?definition=${encodeURIComponent(template.definition)}`}>
            <PlusIcon size={16} className="mr-2 group-hover/btn:rotate-90 transition-transform" />
            Use Template
          </Link>
        </Button>
        <Button 
          asChild 
          variant="outline"
          className="shadow-sm hover:shadow-md transition-all"
        >
          <Link href={`/templates/${template.id}`}>
            Preview
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface TemplatesListClientProps {
  templates: Template[];
}

export function TemplatesListClient({ templates }: TemplatesListClientProps) {
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
        <TemplateCard
          key={template.id}
          template={template}
          categoryColors={categoryColors}
          categoryIcons={categoryIcons}
        />
      ))}
    </div>
  );
}

