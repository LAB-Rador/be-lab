CREATE TABLE "Litter" (
    "id" TEXT NOT NULL,
    "breedingId" TEXT NOT NULL,
    "bornDate" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Litter_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Litter_breedingId_idx" ON "Litter"("breedingId");

ALTER TABLE "Litter" ADD CONSTRAINT "Litter_breedingId_fkey" FOREIGN KEY ("breedingId") REFERENCES "Breeding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
