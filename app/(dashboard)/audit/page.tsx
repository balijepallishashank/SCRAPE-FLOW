import React, { Suspense } from "react";
import { getAuditLogs } from "@/actions/audit/auditActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AuditPage() {
  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track changes and actions across your account
          </p>
        </div>
      </div>

      <div className="flex-1 py-6">
        <Suspense fallback={<AuditSkeleton />}>
          <AuditLogList />
        </Suspense>
      </div>
    </div>
  );
}

function AuditSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

async function AuditLogList() {
  const logs = await getAuditLogs(undefined, 100);

  if (logs.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>No audit logs yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Actions like workflow updates, deletions, and executions will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: Date) =>
    new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <Card key={log.id} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="uppercase text-[10px]">
                    {log.action}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {log.entityType}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {log.entityId ? `Entity: ${log.entityId}` : ""}
                  {log.workflowId ? ` · Workflow: ${log.workflowId}` : ""}
                </div>
                {log.metadata && (
                  <pre className="text-xs bg-muted/50 rounded-md p-2 overflow-auto max-h-24">
{log.metadata}
                  </pre>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(log.createdAt)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
