-- CreateTable
CREATE TABLE "UserBalance" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "credits" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Workflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "definition" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastRunAt" DATETIME,
    "lastRunStatus" TEXT,
    "lastRunId" TEXT,
    "creditsConsumed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Workflow" ("createdAt", "definition", "description", "id", "name", "status", "updatedAt", "userId") SELECT "createdAt", "definition", "description", "id", "name", "status", "updatedAt", "userId" FROM "Workflow";
DROP TABLE "Workflow";
ALTER TABLE "new_Workflow" RENAME TO "Workflow";
CREATE UNIQUE INDEX "Workflow_name_userId_key" ON "Workflow"("name", "userId");
CREATE TABLE "new_WorkflowExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "duration" INTEGER,
    "creditsConsumed" INTEGER NOT NULL DEFAULT 0,
    "definition" TEXT NOT NULL,
    "logs" TEXT NOT NULL,
    "phases" TEXT,
    "output" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WorkflowExecution" ("completedAt", "createdAt", "definition", "error", "id", "logs", "output", "startedAt", "status", "userId", "workflowId") SELECT "completedAt", "createdAt", "definition", "error", "id", "logs", "output", "startedAt", "status", "userId", "workflowId" FROM "WorkflowExecution";
DROP TABLE "WorkflowExecution";
ALTER TABLE "new_WorkflowExecution" RENAME TO "WorkflowExecution";
CREATE INDEX "WorkflowExecution_workflowId_idx" ON "WorkflowExecution"("workflowId");
CREATE INDEX "WorkflowExecution_userId_idx" ON "WorkflowExecution"("userId");
CREATE INDEX "WorkflowExecution_status_idx" ON "WorkflowExecution"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
