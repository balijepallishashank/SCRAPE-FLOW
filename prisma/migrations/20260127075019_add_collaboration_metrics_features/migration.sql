-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "credits" INTEGER NOT NULL DEFAULT 5000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "canCreateWorkflow" BOOLEAN NOT NULL DEFAULT true,
    "canEditWorkflow" BOOLEAN NOT NULL DEFAULT true,
    "canDeleteWorkflow" BOOLEAN NOT NULL DEFAULT false,
    "canExecuteWorkflow" BOOLEAN NOT NULL DEFAULT true,
    "canManageTeam" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrganizationMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SharedWorkflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "orgId" TEXT,
    "shareType" TEXT NOT NULL,
    "publicUrl" TEXT,
    "allowExecution" BOOLEAN NOT NULL DEFAULT true,
    "allowClone" BOOLEAN NOT NULL DEFAULT true,
    "allowEdit" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "cloneCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SharedWorkflow_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExecutionMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "memoryUsed" INTEGER,
    "cpuUsed" REAL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "enabledFor" TEXT,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Organization_ownerId_idx" ON "Organization"("ownerId");

-- CreateIndex
CREATE INDEX "OrganizationMember_orgId_idx" ON "OrganizationMember"("orgId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE INDEX "OrganizationMember_role_idx" ON "OrganizationMember"("role");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_orgId_userId_key" ON "OrganizationMember"("orgId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedWorkflow_publicUrl_key" ON "SharedWorkflow"("publicUrl");

-- CreateIndex
CREATE INDEX "SharedWorkflow_orgId_idx" ON "SharedWorkflow"("orgId");

-- CreateIndex
CREATE INDEX "SharedWorkflow_shareType_idx" ON "SharedWorkflow"("shareType");

-- CreateIndex
CREATE INDEX "SharedWorkflow_publicUrl_idx" ON "SharedWorkflow"("publicUrl");

-- CreateIndex
CREATE UNIQUE INDEX "SharedWorkflow_workflowId_key" ON "SharedWorkflow"("workflowId");

-- CreateIndex
CREATE INDEX "ExecutionMetrics_executionId_idx" ON "ExecutionMetrics"("executionId");

-- CreateIndex
CREATE INDEX "ExecutionMetrics_nodeId_idx" ON "ExecutionMetrics"("nodeId");

-- CreateIndex
CREATE INDEX "ExecutionMetrics_taskType_idx" ON "ExecutionMetrics"("taskType");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_name_key" ON "FeatureFlag"("name");

-- CreateIndex
CREATE INDEX "FeatureFlag_name_idx" ON "FeatureFlag"("name");

-- CreateIndex
CREATE INDEX "FeatureFlag_enabled_idx" ON "FeatureFlag"("enabled");
