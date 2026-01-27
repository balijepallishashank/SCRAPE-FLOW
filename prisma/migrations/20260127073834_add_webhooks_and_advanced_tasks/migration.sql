-- CreateTable
CREATE TABLE "WebhookTrigger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "webhookPath" TEXT NOT NULL,
    "lastTriggeredAt" DATETIME,
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WebhookTrigger_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookTrigger_webhookPath_key" ON "WebhookTrigger"("webhookPath");

-- CreateIndex
CREATE INDEX "WebhookTrigger_workflowId_idx" ON "WebhookTrigger"("workflowId");

-- CreateIndex
CREATE INDEX "WebhookTrigger_userId_idx" ON "WebhookTrigger"("userId");

-- CreateIndex
CREATE INDEX "WebhookTrigger_enabled_idx" ON "WebhookTrigger"("enabled");
