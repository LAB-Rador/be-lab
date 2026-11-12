ALTER TABLE "Laboratory" ADD COLUMN "slug" TEXT;

UPDATE "Laboratory"
SET "slug" = left(trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g')), 40);

UPDATE "Laboratory"
SET "slug" = 'lab'
WHERE "slug" IS NULL OR "slug" = '';

UPDATE "Laboratory"
SET "slug" = "slug" || '-2'
WHERE "slug" IN ('account', 'signin', 'privacy', 'pricing', 'laboratory-setup', 'api', 'auth');

WITH ranked AS (
    SELECT id, row_number() OVER (PARTITION BY "slug" ORDER BY "createdAt", id) AS n
    FROM "Laboratory"
)
UPDATE "Laboratory" AS lab
SET "slug" = left(lab."slug", 40) || '-' || substr(replace(lab.id, '-', ''), 1, 8)
FROM ranked
WHERE lab.id = ranked.id AND ranked.n > 1;

ALTER TABLE "Laboratory" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Laboratory_slug_key" ON "Laboratory"("slug");
