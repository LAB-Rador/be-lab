CREATE TYPE "ReportSource" AS ENUM ('ANIMAL', 'EXPERIMENT', 'TASK');

CREATE TABLE "ReportDefinition" (
    "id" TEXT NOT NULL,
    "laboratoryId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "ReportSource" NOT NULL,
    "columns" JSONB NOT NULL,
    "statusFilter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportDefinition_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReportDefinition_laboratoryId_idx" ON "ReportDefinition"("laboratoryId");

CREATE UNIQUE INDEX "ReportDefinition_laboratoryId_name_key" ON "ReportDefinition"("laboratoryId", "name");

ALTER TABLE "ReportDefinition" ADD CONSTRAINT "ReportDefinition_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReportDefinition" ADD CONSTRAINT "ReportDefinition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
