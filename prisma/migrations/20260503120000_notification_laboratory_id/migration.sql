-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "laboratoryId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Notification_laboratoryId_idx" ON "Notification"("laboratoryId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
