"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2Icon, XCircleIcon, ClockIcon, CoinsIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import RetryExecutionBtn from "./RetryExecutionBtn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PhaseRecord {
  taskType: string;
  status: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  error?: string;
  creditsConsumed?: number;
}

interface ExecutionData {
  id: string;
  workflowId: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  duration: number | null;
  creditsConsumed: number;
  phases: string | null;
  logs: string;
  output: string | null;
  error: string | null;
  workflow: {
    name: string;
    id: string;
  };
}

export default function RunDetailClient({ execution }: { execution: ExecutionData }) {
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number | null>(null);

  const duration = execution.duration
    ? `${(execution.duration / 1000).toFixed(2)}s`
    : "N/A";

  const statusConfig: Record<string, { icon: any; color: string }> = {
    COMPLETED: {
      icon: CheckCircle2Icon,
      color: "bg-green-50 text-green-700 border-green-200",
    },
    FAILED: {
      icon: XCircleIcon,
      color: "bg-red-50 text-red-700 border-red-200",
    },
    RUNNING: {
      icon: ClockIcon,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    PENDING: {
      icon: ClockIcon,
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
  };

  const statusInfo = statusConfig[execution.status] || statusConfig.PENDING;
  const StatusIcon = statusInfo.icon;

  // Parse phases and logs
  const phases: PhaseRecord[] = execution.phases ? JSON.parse(execution.phases) : [];
  const logs = execution.logs ? execution.logs.split("\n") : [];
  const selectedPhase = selectedPhaseIndex !== null ? phases[selectedPhaseIndex] : null;

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Top Header with Navigation Tabs */}
      <div className="flex flex-col w-full px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link href="/runs">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Runs
              </Button>
            </Link>
          </div>
          
          {/* Editor/Runs Navigation Tabs */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Link href={`/workflow/editor/${execution.workflowId}`}>
              <Button variant="ghost" size="sm" className="hover:bg-background">
                Editor
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="bg-background">
              Runs
            </Button>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{execution.workflow.name}</h1>
              <Badge className={statusInfo.color}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {execution.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Run ID: {execution.id.slice(0, 12)}...
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Credits</p>
              <div className="flex items-center gap-1">
                <CoinsIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">{execution.creditsConsumed}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <div className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">{duration}</span>
              </div>
            </div>
            <RetryExecutionBtn workflowId={execution.workflowId} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="flex h-full">
          {/* Left Sidebar: Execution Metadata */}
          <div className="w-64 border-r bg-muted/30 p-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Status</p>
              <Badge className={statusInfo.color}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {execution.status}
              </Badge>
            </div>
            
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Started at</p>
              <p className="text-sm">{new Date(execution.startedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Duration</p>
              <p className="text-sm">{duration}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Credits consumed</p>
              <p className="text-sm font-semibold">{execution.creditsConsumed}</p>
            </div>

            {phases.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Phases</p>
                <div className="space-y-2">
                  {phases.map((phase, index) => {
                    const phaseStatusConfig: Record<string, { icon: any; color: string }> = {
                      completed: {
                        icon: CheckCircle2Icon,
                        color: "text-green-600",
                      },
                      failed: {
                        icon: XCircleIcon,
                        color: "text-red-600",
                      },
                      running: {
                        icon: ClockIcon,
                        color: "text-blue-600",
                      },
                    };

                    const phaseStatus = phaseStatusConfig[phase.status] || phaseStatusConfig.running;
                    const PhaseIcon = phaseStatus.icon;

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                          selectedPhaseIndex === index
                            ? "bg-primary/10 border border-primary"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setSelectedPhaseIndex(index)}
                      >
                        <PhaseIcon className={`w-4 h-4 ${phaseStatus.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{phase.taskType}</p>
                          <p className="text-xs text-muted-foreground">Phase {index + 1}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Content: Tabs and Details */}
          <div className="flex-1 p-6">
            <Tabs defaultValue="execution-details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
                <TabsTrigger value="execution-details">Execution Details</TabsTrigger>
                <TabsTrigger value="logs">Execution Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="execution-details" className="space-y-6">
                {/* Phase Detail Panel */}
                {selectedPhase ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedPhase.taskType} - Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Status and Credits */}
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="font-semibold capitalize">{selectedPhase.status}</p>
                        </div>
                        {selectedPhase.creditsConsumed !== undefined && (
                          <div>
                            <p className="text-sm text-muted-foreground">Credits Used</p>
                            <p className="font-semibold">{selectedPhase.creditsConsumed}</p>
                          </div>
                        )}
                      </div>

                      {/* Error Display */}
                      {selectedPhase.error && (
                        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                          <p className="text-sm font-medium text-red-800 mb-2">Error</p>
                          <p className="text-sm text-red-700">{selectedPhase.error}</p>
                        </div>
                      )}

                      {/* Inputs */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Inputs
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">Inputs used for this phase</p>
                        <div className="space-y-2">
                          {Object.keys(selectedPhase.inputs).length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No parameters generated by this phase</p>
                          ) : (
                            Object.entries(selectedPhase.inputs).map(([key, value]) => (
                              <div
                                key={key}
                                className="p-3 border rounded-lg bg-background"
                              >
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {key}
                                </p>
                                <p className="text-sm font-mono break-all">
                                  {typeof value === "object"
                                    ? JSON.stringify(value, null, 2)
                                    : String(value)}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Outputs */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Outputs
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">Outputs generated by this phase</p>
                        <div className="space-y-2">
                          {Object.keys(selectedPhase.outputs).length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No outputs</p>
                          ) : (
                            Object.entries(selectedPhase.outputs).map(([key, value]) => (
                              <div
                                key={key}
                                className="p-3 border rounded-lg bg-background"
                              >
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  {key}
                                </p>
                                <p className="text-sm font-mono break-all max-h-40 overflow-auto">
                                  {typeof value === "object"
                                    ? JSON.stringify(value, null, 2)
                                    : String(value).length > 200
                                    ? String(value).substring(0, 200) + "..."
                                    : String(value)}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                      <p className="text-lg font-medium text-muted-foreground">No phase selected</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Click on a phase in the sidebar to view its details
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="logs">
                <Card>
                  <CardHeader>
                    <CardTitle>Execution Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 font-mono text-xs">
                      {logs.map((log, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-muted/50 rounded border-l-2 border-transparent hover:border-primary"
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
