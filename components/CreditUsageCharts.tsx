"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface CreditUsageData {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  byWorkflow: Array<{
    workflowId: string;
    workflowName: string;
    creditsUsed: number;
  }>;
  byTask: Array<{
    taskType: string;
    creditsUsed: number;
    executionCount: number;
  }>;
  timeline: Array<{
    date: string;
    creditsUsed: number;
  }>;
}

async function getCreditUsage(): Promise<CreditUsageData> {
  const res = await fetch("/api/analytics/credit-usage");
  if (!res.ok) throw new Error("Failed to fetch credit usage");
  return res.json();
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"];

export default function CreditUsageCharts() {
  const { data, isLoading } = useQuery({
    queryKey: ["credit-usage"],
    queryFn: getCreditUsage,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px]" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const chartConfig = {
    credits: {
      label: "Credits",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Balance</CardTitle>
          <CardDescription>Current credit usage overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-3xl font-bold">{data.totalCredits}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Used</p>
              <p className="text-3xl font-bold text-red-600">{data.usedCredits}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-3xl font-bold text-green-600">
                {data.remainingCredits}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Credits by Workflow */}
        <Card>
          <CardHeader>
            <CardTitle>Credits by Workflow</CardTitle>
            <CardDescription>Which workflows use the most credits</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byWorkflow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="workflowName"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="creditsUsed" fill="var(--color-credits)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Credits by Task Type */}
        <Card>
          <CardHeader>
            <CardTitle>Credits by Task Type</CardTitle>
            <CardDescription>Credit usage breakdown by task</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byTask}
                    dataKey="creditsUsed"
                    nameKey="taskType"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.taskType}: ${entry.creditsUsed}`}
                  >
                    {data.byTask.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Credit Usage Timeline</CardTitle>
            <CardDescription>Daily credit consumption over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="creditsUsed" fill="var(--color-credits)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
