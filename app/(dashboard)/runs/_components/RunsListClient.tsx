"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ClockIcon,
  Download,
  Maximize2,
  Minimize2,
  MoreVertical,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { executeWorkflow } from "@/actions/workflows/executeWorkflow";

type RunStatus = "COMPLETED" | "FAILED" | "RUNNING" | "PENDING";

interface RunItem {
  id: string;
  workflowId: string;
  duration: number | null;
  status: string;
  startedAt: string | Date;
  creditsConsumed: number;
  error?: string | null;
  workflow: { name: string };
}

interface RunsListClientProps {
  runs: RunItem[];
}

async function deleteRun(runId: string) {
  const response = await fetch(`/api/runs/${runId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete run");
  }

  return response.json();
}

async function deleteRuns(runIds: string[]) {
  const response = await fetch("/api/runs/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete runs");
  }

  return response.json();
}

export default function RunsListClient({ runs }: RunsListClientProps) {
  const router = useRouter();
  const [fullscreen, setFullscreen] = useState(false);
  const [deleteRunId, setDeleteRunId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedRunIds, setSelectedRunIds] = useState<Set<string>>(new Set());

  const deleteMutation = useMutation({
    mutationFn: deleteRun,
    onSuccess: () => {
      toast.success("Run deleted successfully");
      setDeleteRunId(null);
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to delete run", {
        description: error.message,
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: deleteRuns,
    onSuccess: (data) => {
      toast.success(`Deleted ${data.deletedCount || 0} runs`);
      setSelectedRunIds(new Set());
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to delete runs", {
        description: error.message,
      });
    },
  });

  const retryMutation = useMutation({
    mutationFn: (workflowId: string) => executeWorkflow(workflowId),
    onSuccess: () => {
      toast.success("Workflow restarted");
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to retry workflow", {
        description: error.message,
      });
    },
  });

  const filteredRuns = useMemo(() => {
    let items = [...runs];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter((run) =>
        run.workflow.name.toLowerCase().includes(q) ||
        run.status.toLowerCase().includes(q) ||
        (run.error || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      items = items.filter((run) => run.status === statusFilter);
    }

    if (dateFilter !== "all") {
      const now = Date.now();
      const cutoff =
        dateFilter === "24h"
          ? now - 24 * 60 * 60 * 1000
          : dateFilter === "7d"
          ? now - 7 * 24 * 60 * 60 * 1000
          : now - 30 * 24 * 60 * 60 * 1000;
      items = items.filter(
        (run) => new Date(run.startedAt).getTime() >= cutoff
      );
    }

    items.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
      }
      if (sortBy === "duration") {
        return (b.duration || 0) - (a.duration || 0);
      }
      if (sortBy === "credits") {
        return b.creditsConsumed - a.creditsConsumed;
      }
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });

    return items;
  }, [runs, searchTerm, statusFilter, dateFilter, sortBy]);

  const selectedRuns = filteredRuns.filter((run) =>
    selectedRunIds.has(run.id)
  );

  const toggleSelect = (runId: string) => {
    setSelectedRunIds((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) {
        next.delete(runId);
      } else {
        next.add(runId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedRunIds((prev) => {
      if (prev.size === filteredRuns.length) {
        return new Set();
      }
      return new Set(filteredRuns.map((run) => run.id));
    });
  };

  const handleExportCsv = () => {
    const rows = [
      [
        "Run ID",
        "Workflow",
        "Status",
        "Started At",
        "Duration (ms)",
        "Credits",
        "Error",
      ],
      ...filteredRuns.map((run) => [
        run.id,
        run.workflow.name,
        run.status,
        new Date(run.startedAt).toISOString(),
        run.duration || "",
        run.creditsConsumed,
        run.error || "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            typeof value === "string"
              ? `"${value.replace(/"/g, '""')}"`
              : value
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `runs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkRetry = async () => {
    const workflowIds = Array.from(
      new Set(
        selectedRuns
          .filter((run) => run.status === "FAILED")
          .map((run) => run.workflowId)
      )
    );

    if (workflowIds.length === 0) {
      toast.error("No failed runs selected for retry");
      return;
    }

    await Promise.all(workflowIds.map((id) => executeWorkflow(id)));
    toast.success("Retry started for selected workflows");
    setSelectedRunIds(new Set());
    router.refresh();
  };

  const STATUS_CONFIG: Record<
    RunStatus,
    { bg: string; text: string; border: string; icon: string }
  > = {
    COMPLETED: {
      bg: "bg-green-500/10",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-500/30",
      icon: "✓",
    },
    FAILED: {
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500/30",
      icon: "✕",
    },
    RUNNING: {
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/30",
      icon: "↻",
    },
    PENDING: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-600 dark:text-yellow-400",
      border: "border-yellow-500/30",
      icon: "⏱",
    },
  };

  const containerClass = fullscreen
    ? "fixed inset-0 z-50 bg-background overflow-auto p-6"
    : "space-y-3";

  return (
    <>
      {/* Fullscreen Toggle Button */}
      <div className={fullscreen ? "hidden" : "mb-4 flex justify-end"}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFullscreen(true)}
          className="gap-2"
        >
          <Maximize2 size={16} />
          Fullscreen
        </Button>
      </div>

      {/* Fullscreen Header */}
      {fullscreen && (
        <div className="fixed top-0 left-0 right-0 bg-background border-b p-4 flex items-center justify-between z-50">
          <h2 className="text-2xl font-bold">Workflow Runs</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen(false)}
            className="gap-2"
          >
            <Minimize2 size={16} />
            Exit Fullscreen
          </Button>
        </div>
      )}

      {/* Filters + Bulk Actions */}
      <div className={fullscreen ? "fixed top-16 left-0 right-0 bg-background z-40 px-6 py-4 border-b" : "mb-4"}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search runs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="RUNNING">Running</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7d</SelectItem>
                <SelectItem value="30d">Last 30d</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
                <SelectItem value="credits">Credits</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedRunIds.size > 0 &&
                  selectedRunIds.size === filteredRuns.length
                }
                onCheckedChange={() => toggleSelectAll()}
              />
              <span className="text-sm text-muted-foreground">
                {selectedRunIds.size} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRetry}
                disabled={selectedRunIds.size === 0}
              >
                <RefreshCw size={16} className="mr-2" />
                Retry Failed
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  bulkDeleteMutation.mutate(Array.from(selectedRunIds))
                }
                disabled={selectedRunIds.size === 0}
              >
                <Trash2 size={16} className="mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Runs List */}
      <div
        className={fullscreen ? `${containerClass} mt-36` : containerClass}
      >
        {filteredRuns.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No runs match your filters.
          </div>
        )}
        {filteredRuns.map((run) => {
          const duration = run.duration
            ? `${(run.duration / 1000).toFixed(1)}s`
            : "N/A";

          const config =
            STATUS_CONFIG[run.status as RunStatus] || STATUS_CONFIG.PENDING;
          const isFailed = run.status === "FAILED";

          return (
            <Card
              key={run.id}
              className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-card/50 backdrop-blur"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedRunIds.has(run.id)}
                        onCheckedChange={() => toggleSelect(run.id)}
                        className="mt-0.5"
                      />
                      <Link
                        href={`/runs/${run.id}`}
                        className="text-lg font-bold hover:text-primary transition-colors group-hover:underline"
                      >
                        {run.workflow.name}
                      </Link>
                      <Badge
                        className={`${config.bg} ${config.text} ${config.border} border font-medium px-2.5 py-0.5`}
                      >
                        <span className="mr-1.5">{config.icon}</span>
                        {run.status as RunStatus}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <ClockIcon size={14} />
                        <span>{new Date(run.startedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Duration:</span>
                        <span>{duration}</span>
                      </div>
                      {run.creditsConsumed > 0 && (
                        <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
                          <span className="font-medium">Credits:</span>
                          <span className="font-bold">{run.creditsConsumed}</span>
                        </div>
                      )}
                    </div>

                    {isFailed && run.error && (
                      <div className="mt-2 p-2 rounded bg-red-500/5 border border-red-500/20">
                        <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                          {run.error}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/runs/${run.id}`}
                      className="px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-all hover:shadow-md"
                    >
                      View Details →
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem asChild>
                          <Link href={`/runs/${run.id}`}>View</Link>
                        </DropdownMenuItem>
                        {isFailed && (
                          <DropdownMenuItem
                            onClick={() => retryMutation.mutate(run.workflowId)}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteRunId(run.id)}
                          className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteRunId !== null}
        onOpenChange={(open) => !open && setDeleteRunId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Run?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The run record will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteRunId) {
                  deleteMutation.mutate(deleteRunId);
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
