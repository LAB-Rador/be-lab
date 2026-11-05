CREATE TABLE "Cage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "laboratoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Cage_laboratoryId_idx" ON "Cage"("laboratoryId");

CREATE UNIQUE INDEX "Cage_name_laboratoryId_key" ON "Cage"("name", "laboratoryId");

ALTER TABLE "Cage" ADD CONSTRAINT "Cage_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Animal" ADD COLUMN "cageId" TEXT;

CREATE INDEX "Animal_cageId_idx" ON "Animal"("cageId");

ALTER TABLE "Animal" ADD CONSTRAINT "Animal_cageId_fkey" FOREIGN KEY ("cageId") REFERENCES "Cage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
