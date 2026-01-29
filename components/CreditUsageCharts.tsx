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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("/api/analytics/credit-usage", { signal: controller.signal });
    if (!res.ok) throw new Error("Failed to fetch credit usage");
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"];

export default function CreditUsageCharts() {
  const { data, isLoading, isError } = useQuery({
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

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Usage</CardTitle>
          <CardDescription>Unable to load analytics right now</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please refresh the page or try again in a moment.
          </p>
        </CardContent>
      </Card>
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
            <CardTitle className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              Credit Usage Timeline
            </CardTitle>
            <CardDescription>Daily credit consumption trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis 
                    stroke="#888"
                    style={{ fontSize: "12px" }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="creditsUsed" 
                    stroke="#22c55e" 
                    strokeWidth={3}
                    dot={{ fill: "#22c55e", r: 5 }}
                    activeDot={{ r: 7, fill: "#16a34a" }}
                    fillOpacity={1}
                    fill="url(#colorCredits)"
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 pt-4 border-t flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-muted-foreground">Daily Credits Used</span>
              </div>
              <div className="text-sm font-semibold text-green-600">
                Total: {data.timeline.reduce((sum, item) => sum + item.creditsUsed, 0)} credits
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
