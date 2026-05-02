-- AlterTable: creator for tasks (backfill from assignee for existing rows)
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "createdById" TEXT;

UPDATE "Task" SET "createdById" = "assignedToId" WHERE "createdById" IS NULL;

ALTER TABLE "Task" ALTER COLUMN "createdById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_createdById_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
