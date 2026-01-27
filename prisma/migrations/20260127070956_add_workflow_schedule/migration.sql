-- CreateTable
CREATE TABLE "WorkflowSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "cronExpression" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "lastRunAt" DATETIME,
    "nextRunAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkflowSchedule_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WorkflowSchedule_workflowId_idx" ON "WorkflowSchedule"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowSchedule_userId_idx" ON "WorkflowSchedule"("userId");

-- CreateIndex
CREATE INDEX "WorkflowSchedule_enabled_idx" ON "WorkflowSchedule"("enabled");

-- CreateIndex
CREATE INDEX "WorkflowSchedule_nextRunAt_idx" ON "WorkflowSchedule"("nextRunAt");
