-- Tournament state machine — renombra valores del enum a la nueva nomenclatura.
--
-- Mapping legacy → nuevo:
--   DRAFT          -> DRAFT
--   OPEN           -> INSCRIPTION_OPEN
--   CLOSED         -> INSCRIPTION_CLOSED
--   READY_TO_SHIP  -> IN_PROGRESS
--   IN_PROGRESS    -> PLAYING
--   FINISHED       -> FINISHED
--   ARCHIVED       -> ARCHIVED
--   CANCELLED      -> ARCHIVED
--
-- PUBLISHED es nuevo (sin filas legacy mapeadas).

-- 1) Crear el nuevo enum
CREATE TYPE "TournamentStatus_new" AS ENUM (
  'DRAFT',
  'PUBLISHED',
  'INSCRIPTION_OPEN',
  'INSCRIPTION_CLOSED',
  'IN_PROGRESS',
  'PLAYING',
  'FINISHED',
  'ARCHIVED'
);

-- 2) Quitar el default para poder cambiar el tipo
ALTER TABLE "tournaments" ALTER COLUMN "status" DROP DEFAULT;

-- 3) Migrar datos al tipo nuevo con mapping explícito
ALTER TABLE "tournaments"
  ALTER COLUMN "status" TYPE "TournamentStatus_new"
  USING (
    CASE "status"::text
      WHEN 'DRAFT'          THEN 'DRAFT'
      WHEN 'OPEN'           THEN 'INSCRIPTION_OPEN'
      WHEN 'CLOSED'         THEN 'INSCRIPTION_CLOSED'
      WHEN 'READY_TO_SHIP'  THEN 'IN_PROGRESS'
      WHEN 'IN_PROGRESS'    THEN 'PLAYING'
      WHEN 'FINISHED'       THEN 'FINISHED'
      WHEN 'ARCHIVED'       THEN 'ARCHIVED'
      WHEN 'CANCELLED'      THEN 'ARCHIVED'
      ELSE 'DRAFT'
    END
  )::"TournamentStatus_new";

-- 4) Reemplazar el enum viejo por el nuevo
DROP TYPE "TournamentStatus";
ALTER TYPE "TournamentStatus_new" RENAME TO "TournamentStatus";

-- 5) Restaurar default
ALTER TABLE "tournaments" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
