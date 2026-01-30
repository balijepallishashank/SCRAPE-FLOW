"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart as RechartsLineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, LineChart } from "lucide-react";

interface ExecutionStatusData {
  date: string;
  monthKey: string;
  monthLabel: string;
  Success: number;
  Failed: number;
}

interface DailyCreditsData {
  date: string;
  monthKey: string;
  monthLabel: string;
  "Successful Phases Credits": number;
  "Failed Phases Credits": number;
}

interface ChartsProps {
  executionStatusData: ExecutionStatusData[];
  dailyCreditsData: DailyCreditsData[];
}

export function ChartsClient({ executionStatusData, dailyCreditsData }: ChartsProps) {
  const months = useMemo(() => {
    const map = new Map<string, string>();
    [...executionStatusData, ...dailyCreditsData].forEach((item) => {
      if (item.monthKey) {
        map.set(item.monthKey, item.monthLabel || item.monthKey);
      }
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [executionStatusData, dailyCreditsData]);

  const [selectedMonth, setSelectedMonth] = useState<string>(months.at(-1)?.[0] ?? "all");

  useEffect(() => {
    if (months.length > 0) {
      setSelectedMonth(months.at(-1)?.[0] ?? "all");
    }
  }, [months]);

  const filteredExecution = selectedMonth === "all"
    ? executionStatusData
    : executionStatusData.filter((item) => item.monthKey === selectedMonth);

  const filteredCredits = selectedMonth === "all"
    ? dailyCreditsData
    : dailyCreditsData.filter((item) => item.monthKey === selectedMonth);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <label className="text-sm text-muted-foreground mr-2">Month</label>
        <select
          className="border border-neutral-200 dark:border-neutral-800 rounded-md px-2 py-1 text-sm bg-white dark:bg-neutral-900"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
          disabled={months.length === 0}
        >
          {months.length === 0 ? (
            <option value="all">No data</option>
          ) : (
            months.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))
          )}
        </select>
      </div>
      {/* Workflow execution status chart */}
      <Card className="border border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart size={20} className="text-green-600" />
            Workflow execution status
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Daily number of successful and failed workflow executions
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={filteredExecution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Success" stroke="#16a34a" strokeWidth={2} fill="#dcfce7" isAnimationActive={false} />
              <Line type="monotone" dataKey="Failed" stroke="#dc2626" strokeWidth={2} isAnimationActive={false} />
            </RechartsLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily credits spent chart */}
      <Card className="border border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} className="text-green-600" />
            Daily credits spent
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Daily credit consumed in selected period
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredCredits}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Successful Phases Credits" fill="#16a34a" />
              <Bar dataKey="Failed Phases Credits" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
