-- AlterTable: add nullable slug column
ALTER TABLE "categories" ADD COLUMN "slug" TEXT;

-- Backfill existing categories with slug derived from name
UPDATE "categories"
SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRANSLATE(name, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
);

-- Handle duplicate slugs within the same tournament by appending a suffix
WITH duplicates AS (
  SELECT id, "tournamentId", slug,
    ROW_NUMBER() OVER (PARTITION BY "tournamentId", slug ORDER BY "createdAt") AS rn
  FROM "categories"
  WHERE slug IS NOT NULL
)
UPDATE "categories" c
SET slug = d.slug || '-' || d.rn
FROM duplicates d
WHERE c.id = d.id AND d.rn > 1;

-- CreateIndex
CREATE UNIQUE INDEX "categories_tournamentId_slug_key" ON "categories"("tournamentId", "slug");
