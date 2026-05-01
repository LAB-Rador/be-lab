-- AlterTable
ALTER TABLE "Animal" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Experiment" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "AnimalRecord" ADD COLUMN "experimentId" TEXT;

-- CreateIndex
CREATE INDEX "AnimalRecord_experimentId_idx" ON "AnimalRecord"("experimentId");

-- AddForeignKey
ALTER TABLE "AnimalRecord" ADD CONSTRAINT "AnimalRecord_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
