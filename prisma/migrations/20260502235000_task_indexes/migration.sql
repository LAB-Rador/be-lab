-- Add helpful indexes for tasks/notifications/laboratory name
CREATE INDEX IF NOT EXISTS "Laboratory_name_idx" ON "Laboratory"(name);
CREATE INDEX IF NOT EXISTS "Task_laboratoryId_idx" ON "Task"("laboratoryId");
CREATE INDEX IF NOT EXISTS "Task_experimentId_idx" ON "Task"("experimentId");
CREATE INDEX IF NOT EXISTS "Task_laboratoryId_status_idx" ON "Task"("laboratoryId", "status");
CREATE INDEX IF NOT EXISTS "Task_laboratoryId_assignedToId_idx" ON "Task"("laboratoryId", "assignedToId");
CREATE INDEX IF NOT EXISTS "Task_laboratoryId_dueDate_idx" ON "Task"("laboratoryId", "dueDate");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
