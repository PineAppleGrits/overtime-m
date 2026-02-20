-- AlterTable: Add slug column as nullable first
ALTER TABLE "tournaments" ADD COLUMN "slug" TEXT;

-- Backfill existing rows: generate slug from name (lowercase, replace spaces/special chars with hyphens)
UPDATE "tournaments"
SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRIM("name"),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
)
WHERE "slug" IS NULL;

-- Handle potential duplicates by appending a suffix
UPDATE "tournaments" t1
SET "slug" = t1."slug" || '-' || SUBSTRING(t1."id"::TEXT, 1, 8)
WHERE EXISTS (
  SELECT 1 FROM "tournaments" t2
  WHERE t2."slug" = t1."slug" AND t2."id" < t1."id"
);

-- Make the column NOT NULL
ALTER TABLE "tournaments" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_slug_key" ON "tournaments"("slug");
