/*
  Warnings:

  - A unique constraint covering the columns `[name,userId]` on the table `Workflow` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Workflow_name_userId_key" ON "Workflow"("name", "userId");
