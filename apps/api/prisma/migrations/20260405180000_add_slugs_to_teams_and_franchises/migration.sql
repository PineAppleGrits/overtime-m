-- AlterTable: Add slug columns as nullable first
ALTER TABLE "franchises" ADD COLUMN "slug" TEXT;
ALTER TABLE "teams" ADD COLUMN "slug" TEXT;

-- Backfill existing franchises with slug based on name
UPDATE "franchises"
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

-- Backfill existing teams with slug based on name
UPDATE "teams"
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

-- Handle potential duplicate franchise slugs
UPDATE "franchises" f1
SET "slug" = f1."slug" || '-' || SUBSTRING(f1."id"::TEXT, 1, 8)
WHERE EXISTS (
  SELECT 1 FROM "franchises" f2
  WHERE f2."slug" = f1."slug" AND f2."id" < f1."id"
);

-- Handle potential duplicate team slugs
UPDATE "teams" t1
SET "slug" = t1."slug" || '-' || SUBSTRING(t1."id"::TEXT, 1, 8)
WHERE EXISTS (
  SELECT 1 FROM "teams" t2
  WHERE t2."slug" = t1."slug" AND t2."id" < t1."id"
);

-- Fallback in case a slug becomes empty after normalization
UPDATE "franchises"
SET "slug" = 'franchise-' || SUBSTRING("id"::TEXT, 1, 8)
WHERE "slug" IS NULL OR "slug" = '';

UPDATE "teams"
SET "slug" = 'team-' || SUBSTRING("id"::TEXT, 1, 8)
WHERE "slug" IS NULL OR "slug" = '';

-- Make columns NOT NULL
ALTER TABLE "franchises" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "teams" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "franchises_slug_key" ON "franchises"("slug");
CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");
