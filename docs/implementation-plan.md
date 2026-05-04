# Plan de Implementación — Cierre de Backend

**Fecha**: 2026-05-03
**Alcance**: completar todos los endpoints y casos de uso del backend para las entidades core: equipos, torneos, categorías, zonas, árbitros, oficiales de mesa, fotógrafos, deudas, pagos, amistosos, categorización y playoffs.
**Foco**: básquet (3v3 y 5v5). Diseñado para extender a otros deportes.

---

## Decisiones arquitectónicas

Resumen de las decisiones tomadas durante la planificación. Detalle ampliado en `memory/project_backend_completion_plan.md`.

| Tema | Decisión |
|------|----------|
| Arquitectura | Clean architecture (b) uniforme: `domain/` · `application/` · `infrastructure/` · `presentation/` por feature |
| Multi-deporte | Strategy híbrida; `Sport=BASKETBALL` único + `Tournament.modality` |
| Modalidades | Strategies `Basketball5v5Rules` y `Basketball3v3Rules` |
| Deudas | Módulo `Debts` unificado; `Payment` migra a apuntar a `Debt` |
| Cron | `@nestjs/schedule` + advisory locks Postgres + idempotencia |
| Storage | 2 buckets (`public`, `private`) + tabla `MediaAsset` central; TTL signed URLs 1h |
| Categorización | `CategoryLevel` global por deporte; hasta 2 niveles por equipo; permanente |
| Playoffs | `PlayoffSeries` + `Match.seriesId`; BO1/BO3/BO5 por ronda; cruce NBA |
| Friendlies | Alcance completo + emails admin manual + señas + Match al confirmar |
| Docs FE | `docs/features/<entidad>.md` + auto-gen OpenAPI a `packages/shared/src/generated/` |
| Errores | Códigos estables (`enum ErrorCode`) + mensajes en español |
| Versionado | `/api/v1/` desde el inicio |
| Eventos | `@nestjs/event-emitter` |
| Workflow | PR0 schema-first secuencial → Olas 1-3 paralelas (3-4 agentes/ola) directo a main |
| Tests | Obligatorios en dominio (unitarios) + funciones puras de RN; E2E posterior |
| CI | GitHub Actions: lint + typecheck + build + jest, sumado en PR0 |

---

## Estructura de carpetas estándar (clean architecture)

Cada feature sigue:

```
apps/api/src/<feature>/
├── domain/
│   ├── entities/         # Team, Tournament, Debt, etc. — con comportamiento
│   ├── value-objects/    # Money, JerseyNumber, ...
│   ├── rules/            # Funciones puras: canPlayerJoinTeam, scoreCounts, etc.
│   └── events/           # Tipos de eventos del dominio (ej. RegistrationApproved)
├── application/
│   ├── use-cases/        # Un archivo por caso de uso (CreateTeamUseCase, ...)
│   ├── ports/            # Interfaces (ITeamRepository, INotificationsPort, ...)
│   └── dtos/             # Input/Output de use-cases (no HTTP)
├── infrastructure/
│   ├── repositories/     # PrismaTeamRepository implementa ITeamRepository
│   ├── adapters/         # SupabaseStorageAdapter, MercadoPagoAdapter, ...
│   └── listeners/        # Event listeners (suscriben a otros features)
├── presentation/
│   ├── controllers/      # HTTP → llama use-case
│   ├── dto/              # Zod schemas para HTTP
│   └── mappers/          # entity → response DTO
└── <feature>.module.ts
```

---

## Ola 0 — PR0 Foundation (yo, secuencial)

**Objetivo**: dejar mergeada toda la base de schema, infraestructura común, y tipos compartidos, antes de lanzar agentes en paralelo.

**Branch**: `feat/api/foundation-pr0`
**Owner**: yo (Claude Opus en main thread).
**Bloquea**: todas las olas 1-3.

### Cambios incluidos

#### 1. Schema Prisma — modelos nuevos

```prisma
// MediaAsset — storage centralizado
model MediaAsset {
  id                  String       @id @default(uuid())
  bucket              String       // 'public' | 'private'
  storageKey          String       // path dentro del bucket
  contentType         String
  sizeBytes           Int
  sha256              String
  originalFilename    String
  uploadedByProfileId String
  uploadedBy          Profile      @relation("MediaAssetUploadedBy", fields: [uploadedByProfileId], references: [id])
  visibility          MediaVisibility
  category            MediaCategory
  metadata            Json?        // year, debtId, sanctionId, etc.
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
  deletedAt           DateTime?
  scheduledDeletionAt DateTime?    // RN-060: borrado automático

  @@index([uploadedByProfileId])
  @@index([category])
  @@index([scheduledDeletionAt])
  @@map("media_assets")
}

enum MediaVisibility { PUBLIC PRIVATE }
enum MediaCategory {
  AVATAR
  TEAM_LOGO
  FRANCHISE_LOGO
  TOURNAMENT_BANNER
  PAYMENT_PROOF
  MEDICAL_CERT
  SWORN_STATEMENT
  DNI_PHOTO
  SANCTION_ATTACHMENT
  BLACKLIST_ATTACHMENT
  OTHER
}

// Debt — deuda unificada
model Debt {
  id                  String        @id @default(uuid())
  type                DebtType
  status              DebtStatus    @default(APPROVED)
  concept             String
  originAmount        Decimal       @db.Decimal(12, 2)
  currentBalance      Decimal       @db.Decimal(12, 2)
  currency            String        @default("ARS")
  dueDate             DateTime
  // Targets (al menos uno)
  teamId              String?
  team                Team?         @relation(fields: [teamId], references: [id])
  profileId           String?
  profile             Profile?      @relation("DebtTargetProfile", fields: [profileId], references: [id])
  // Origenes opcionales
  registrationId      String?
  registration        Registration? @relation(fields: [registrationId], references: [id])
  matchId             String?
  match               Match?        @relation(fields: [matchId], references: [id])
  friendlyId          String?
  friendly            Friendly?     @relation(fields: [friendlyId], references: [id])
  sanctionId          String?
  sanction            Sanction?     @relation(fields: [sanctionId], references: [id])
  parentDebtId        String?
  parentDebt          Debt?         @relation("DebtHierarchy", fields: [parentDebtId], references: [id])
  childDebts          Debt[]        @relation("DebtHierarchy")
  // Metadata
  notes               String?
  metadata            Json?
  createdByProfileId  String
  createdBy           Profile       @relation("DebtCreatedBy", fields: [createdByProfileId], references: [id])
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  deletedAt           DateTime?

  payments            Payment[]
  audits              DebtAudit[]

  @@index([teamId])
  @@index([profileId])
  @@index([status])
  @@index([type])
  @@index([dueDate])
  @@index([parentDebtId])
  @@map("debts")
}

enum DebtType {
  REGISTRATION_FEE
  INSURANCE
  LATE_ROSTER_FEE
  MATCH_FEE
  FRIENDLY_DEPOSIT
  MISSED_MATCH_FINE
  LATE_NOTICE_FINE
  LATE_PAYMENT_DAILY_CHARGE
  OVERDUE_INTEREST
  AJC_FEE
  OTHER_MANUAL
}

enum DebtStatus {
  APPROVED
  PARTIALLY_PAID
  PAID
  DELETED_BY_ERROR
  DELETED_WITH_RECORD
  CANCELLED
}

model DebtAudit {
  id                String     @id @default(uuid())
  debtId            String
  debt              Debt       @relation(fields: [debtId], references: [id])
  fromStatus        DebtStatus
  toStatus          DebtStatus
  reason            String?
  byProfileId       String
  by                Profile    @relation(fields: [byProfileId], references: [id])
  at                DateTime   @default(now())

  @@index([debtId])
  @@index([byProfileId])
  @@map("debt_audits")
}

// CategoryLevel — niveles globales por deporte
model CategoryLevel {
  id          String   @id @default(uuid())
  sportId     String
  sport       Sport    @relation(fields: [sportId], references: [id])
  code        String   // 'A' | 'B' | 'C' | 'D' ...
  displayName String
  rank        Int      // 1 = más alto
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  teamLevels      TeamCategoryLevel[]
  categories      Category[]

  @@unique([sportId, code])
  @@index([sportId, rank])
  @@map("category_levels")
}

model TeamCategoryLevel {
  id                  String        @id @default(uuid())
  teamId              String
  team                Team          @relation(fields: [teamId], references: [id])
  categoryLevelId     String
  categoryLevel       CategoryLevel @relation(fields: [categoryLevelId], references: [id])
  grantedByProfileId  String
  grantedBy           Profile       @relation(fields: [grantedByProfileId], references: [id])
  grantedAt           DateTime      @default(now())
  notes               String?

  @@unique([teamId, categoryLevelId])
  @@index([teamId])
  @@map("team_category_levels")
}

// Friendly
model Friendly {
  id                       String          @id @default(uuid())
  sportId                  String
  sport                    Sport           @relation(fields: [sportId], references: [id])
  modality                 String
  homeTeamId               String
  homeTeam                 Team            @relation("FriendlyHome", fields: [homeTeamId], references: [id])
  awayTeamId               String
  awayTeam                 Team            @relation("FriendlyAway", fields: [awayTeamId], references: [id])
  proposedDate             DateTime
  venueId                  String?
  venue                    Venue?          @relation(fields: [venueId], references: [id])
  status                   FriendlyStatus  @default(REQUESTED)
  notes                    String?
  homeDepositDebtId        String?         @unique
  homeDepositDebt          Debt?           @relation("FriendlyHomeDeposit", fields: [homeDepositDebtId], references: [id])
  awayDepositDebtId        String?         @unique
  awayDepositDebt          Debt?           @relation("FriendlyAwayDeposit", fields: [awayDepositDebtId], references: [id])
  confirmationDeadline     DateTime?
  resultingMatchId         String?         @unique
  resultingMatch           Match?          @relation(fields: [resultingMatchId], references: [id])
  observedForCategorization Boolean        @default(false)
  createdByProfileId       String
  createdBy                Profile         @relation("FriendlyCreatedBy", fields: [createdByProfileId], references: [id])
  generatedByProfileId     String?
  generatedBy              Profile?        @relation("FriendlyGeneratedBy", fields: [generatedByProfileId], references: [id])
  generatedAt              DateTime?
  cancelledAt              DateTime?
  cancellationReason       String?
  createdAt                DateTime        @default(now())
  updatedAt                DateTime        @updatedAt
  deletedAt                DateTime?

  debts                    Debt[]

  @@index([homeTeamId])
  @@index([awayTeamId])
  @@index([status])
  @@index([proposedDate])
  @@map("friendlies")
}

enum FriendlyStatus {
  REQUESTED
  GENERATED
  PENDING_CONFIRMATION
  CONFIRMED
  EXPIRED
  CANCELLED
  PLAYED
  OBSERVED_FOR_CATEGORIZATION
}

// PlayoffSeries
model PlayoffSeries {
  id                String         @id @default(uuid())
  categoryId        String
  category          Category       @relation(fields: [categoryId], references: [id])
  round             PlayoffRound
  bracketPosition   Int            // 1, 2, 3, 4 dentro de la ronda
  format            PlayoffFormat  // BO1 | BO3 | BO5
  homeTeamId        String?
  homeTeam          Team?          @relation("PlayoffSeriesHome", fields: [homeTeamId], references: [id])
  awayTeamId        String?
  awayTeam          Team?          @relation("PlayoffSeriesAway", fields: [awayTeamId], references: [id])
  feedsFromSeriesAId String?       // ascendiente A
  feedsFromSeriesA   PlayoffSeries? @relation("FeedsFromA", fields: [feedsFromSeriesAId], references: [id])
  feedsFromSeriesBId String?       // ascendiente B
  feedsFromSeriesB   PlayoffSeries? @relation("FeedsFromB", fields: [feedsFromSeriesBId], references: [id])
  feedsFromA         PlayoffSeries[] @relation("FeedsFromA")
  feedsFromB         PlayoffSeries[] @relation("FeedsFromB")
  winnerTeamId      String?
  winnerTeam        Team?          @relation("PlayoffSeriesWinner", fields: [winnerTeamId], references: [id])
  status            PlayoffSeriesStatus @default(PENDING)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  matches           Match[]

  @@unique([categoryId, round, bracketPosition])
  @@index([categoryId])
  @@index([status])
  @@map("playoff_series")
}

enum PlayoffRound {
  PLAY_IN
  ROUND_OF_16
  QUARTERFINAL
  SEMIFINAL
  THIRD_PLACE
  FINAL
  PROMOTION_PLAYOFF // RN-058 repechaje
}

enum PlayoffFormat { BO1 BO3 BO5 }

enum PlayoffSeriesStatus {
  PENDING       // sin equipos asignados (esperando alimentadores)
  READY         // equipos definidos, sin matches generados
  IN_PROGRESS
  COMPLETED
}
```

#### 2. Modificaciones a modelos existentes

```prisma
// Tournament — config de repechaje
model Tournament {
  // ... campos existentes
  promotionPlayoffFormat   PlayoffFormat @default(BO1)  // RN-058
  earlyCancellationThresholdHours Int? // DP-013, configurable cuando se decida
}

// Category — config de playoffs
model Category {
  // ... campos existentes
  categoryLevelId          String?
  categoryLevel            CategoryLevel? @relation(fields: [categoryLevelId], references: [id])
  zonesCount               Int            @default(1)  // 1 o 2 en v1
  qualifierCount           Int?           // total de clasificados
  qualifiersPerZone        Int?           // si hay zonas, cuántos por zona
  hasPlayIn                Boolean        @default(false)
  hasThirdPlaceMatch       Boolean        @default(false)
  playoffFormatByRound     Json?          // { quarterfinal: 'BO3', semifinal: 'BO3', final: 'BO5', thirdPlace: 'BO1' }

  playoffSeries            PlayoffSeries[]
}

// Match — link a serie de playoff
model Match {
  // ... campos existentes
  seriesId                 String?
  series                   PlayoffSeries? @relation(fields: [seriesId], references: [id])
  seriesGameNumber         Int?
  playoffStage             PlayoffRound?
  // matchType existente; valores: 'regular' | 'playoff' | 'friendly' | 'play_in' | 'promotion_playoff'
}

// Payment — debtId reemplaza matchId/registrationId para nuevos pagos
model Payment {
  // ... campos existentes
  debtId            String?
  debt              Debt?     @relation(fields: [debtId], references: [id])
  // matchId, registrationId quedan nullable para histórico
}

// Profile — assets opcionales (compatibilidad híbrida)
model Profile {
  // ... campos existentes
  avatarAssetId           String?
  avatarAsset             MediaAsset? @relation("ProfileAvatar", fields: [avatarAssetId], references: [id])
  currentMedicalAssetId   String?
  currentMedicalAsset     MediaAsset? @relation("ProfileMedical", fields: [currentMedicalAssetId], references: [id])
  currentSwornAssetId     String?
  currentSwornAsset       MediaAsset? @relation("ProfileSworn", fields: [currentSwornAssetId], references: [id])
  dniPhotoAssetId         String?
  dniPhotoAsset           MediaAsset? @relation("ProfileDni", fields: [dniPhotoAssetId], references: [id])
}

// Team — categoryLevels
model Team {
  // ... campos existentes
  categoryLevels    TeamCategoryLevel[]
  logoAssetId       String?
  logoAsset         MediaAsset? @relation("TeamLogo", fields: [logoAssetId], references: [id])
}
```

#### 3. Infraestructura común

- `apps/api/src/common/storage/`
  - `storage.module.ts`
  - `supabase-storage.service.ts` — upload/getSignedUrl/delete
  - `media-asset.service.ts` — wrapper que crea/busca/borra `MediaAsset` + storage subyacente
- `apps/api/src/common/sport-rules/`
  - `sport-rules.module.ts`
  - `sport-rules.registry.ts` — selecciona strategy por (sportCode, modality)
  - `interfaces/sport-rules.interface.ts`
  - `strategies/basketball-5v5.rules.ts`
  - `strategies/basketball-3v3.rules.ts`
- `apps/api/src/common/errors/`
  - `error-codes.ts` — `enum ErrorCode { REGISTRATION_DUPLICATE, TOURNAMENT_CLOSED, ... }`
  - `business-error.ts` — exception class con `code` y `message`
  - Filter actualizado para serializar `{ code, message, details? }`
- `apps/api/src/common/cron/`
  - `advisory-lock.service.ts` — `pg_try_advisory_lock` wrapper
  - `cron-base.service.ts` — clase abstracta para jobs idempotentes
- `apps/api/src/common/events/`
  - Importar `EventEmitterModule.forRoot()` en AppModule
  - `domain-events.ts` — namespace con todos los nombres de evento

#### 4. Tipos compartidos

- `packages/shared/src/sport/` — `SportCode`, `Modality`, `SportRulesPublic` (versión read-only para FE).
- `packages/shared/src/debt/` — DTOs de `Debt`.
- `packages/shared/src/playoff/` — DTOs de `PlayoffSeries`, brackets.
- `packages/shared/src/friendly/` — DTOs de `Friendly`.
- `packages/shared/src/media/` — DTOs de `MediaAsset`, signed-url request/response.
- `packages/shared/src/category-level/` — DTOs.
- `packages/shared/src/error-codes.ts` — re-exporta `enum ErrorCode` para que el FE pueda matchear.
- `packages/shared/src/generated/` — placeholder; se llena con `pnpm generate:api-types`.

#### 5. Generación automática de tipos OpenAPI

- Script `pnpm generate:api-types`:
  1. Inicia el API en modo "spec only".
  2. Vuelca `swagger.json`.
  3. Corre `openapi-typescript` para producir tipos en `packages/shared/src/generated/api.d.ts`.
- Documentado en `apps/api/CLAUDE.md` y root README.

#### 6. CI básico (GitHub Actions)

`.github/workflows/ci.yml`:
- Trigger: PRs a main + pushes a main.
- Jobs:
  - `lint` (turbo lint)
  - `typecheck` (turbo run typecheck — requiere agregar script en cada package)
  - `build` (turbo build)
  - `test` (apps/api: `pnpm test`)
- Cache de pnpm + node_modules.

#### 7. Plantilla de doc por feature

`docs/features/_template.md` con la estructura aprobada (casos de uso, RNs, modelo, endpoints, errores, eventos, pendientes).

#### 8. Documentación de Ola 0

`docs/features/foundation.md` describiendo qué se agregó y cómo se usa cada pieza común (storage, sport-rules, error codes, eventos).

---

## Olas 1-3 — Features paralelas

Cada bloque describe un worktree independiente. PR0 debe estar mergeada antes de iniciar.

### Ola 1 (paralelo, 4 agentes)

#### W1.1 — Tournaments completion
- **Branch**: `feat/api/tournaments-completion`
- **Scope**: completar gaps de Tournament (modality validation, pricing periods endpoints, insurance per player config, repechaje config, ventana de operaciones, status transitions, sport rules wiring).
- **RNs**: RN-043, RN-044, RN-045, RN-046, RN-048, RN-058.
- **Output**: docs/features/tournaments.md.

#### W1.2 — Categories + Zones completion
- **Branch**: `feat/api/categories-zones-completion`
- **Scope**: completar Category (categoryLevel link, playoff config endpoints, substatus transitions), Zones (auto-balance teams, validate max 2 zones).
- **RNs**: RN-044, RN-045, RN-047.
- **Output**: docs/features/categories.md, docs/features/zones.md.

#### W1.3 — Teams + Categorización
- **Branch**: `feat/api/teams-categorization`
- **Scope**: completar Teams (logoAsset wiring, validation min 8 jugadores, RN-009), CategoryLevel CRUD, TeamCategoryLevel assignment, endpoint `/teams/categorization/pending`.
- **RNs**: RN-001, RN-002, RN-005, RN-009, RN-039, RN-044.
- **Dependencias**: necesita Friendlies (W1.4) para listar equipos con observaciones suficientes — coordinar via interface, no por código directo.
- **Output**: docs/features/teams.md, docs/features/categorization.md.

#### W1.4 — Friendlies
- **Branch**: `feat/api/friendlies`
- **Scope**: implementación completa (form web + admin manual + emails delegados + señas Debt + ventana 24h + materialización en Match al confirmar + observedForCategorization + cron de expiración).
- **RNs**: RN-022, RN-023, RN-039, RN-059.
- **Output**: docs/features/friendlies.md.

### Ola 2 (paralelo, 3 agentes; depende de Ola 1)

#### W2.1 — Debts module + cron de cargos
- **Branch**: `feat/api/debts`
- **Scope**: módulo Debts completo (CRUD admin, lifecycle states, audit log, listado por equipo/jugador), `Payment.debtId` migration logic, partial payments, cron de OVERDUE_INTEREST (RN-028) + LATE_PAYMENT_DAILY_CHARGE (RN-029) + auto-delete de payment proofs (RN-060).
- **RNs**: RN-025, RN-026, RN-027, RN-028, RN-029, RN-030, RN-031, RN-053, RN-060.
- **Output**: docs/features/debts.md.

#### W2.2 — Payments completion
- **Branch**: `feat/api/payments-completion`
- **Scope**: migrar checkout/MP para apuntar a Debt; soportar pagos parciales; uploads de comprobante (transferencia) → MediaAsset; mark-paid actualiza Debt y dispara evento; soportar splits (un partido = 2 debts, una por equipo).
- **RNs**: RN-014, RN-015, RN-016, RN-017, RN-022.
- **Output**: docs/features/payments.md (extendiendo el actual).

#### W2.3 — Pricing & Discounts
- **Branch**: `feat/api/pricing`
- **Scope**: endpoints de TournamentRegistrationPricing (periods + payment methods RN-048), descuentos manuales (RN-020), descuento por franquicia (RN-012, marcar como TODO con DP-011 abierta).
- **RNs**: RN-020, RN-021, RN-048, RN-012.
- **Output**: docs/features/pricing.md.

### Ola 3 (paralelo, 4 agentes; depende de Ola 2)

#### W3.1 — Match lifecycle + Playoffs
- **Branch**: `feat/api/match-lifecycle-playoffs`
- **Scope**: bracket auto-generation al `completeRegularPhase`, override manual, advance-on-winner, manejo de suspended/mutual-cancel/cross-zone-bracket, tiebreaker manual admin BO1 0-0, repechaje generation post-tournament.
- **RNs**: RN-024, RN-045, RN-047, RN-049, RN-052, RN-053, RN-054, RN-055, RN-056, RN-058.
- **Output**: docs/features/playoffs.md, ampliar docs/features/matches.md.

#### W3.2 — Staff completion
- **Branch**: `feat/api/staff-completion`
- **Scope**: validación min staff por partido (RN-049), AJC formula (sueldo árbitro × fechas, RN-030), Drive folder creation al iniciar partido (RN-051), salary config por staff/torneo.
- **RNs**: RN-049, RN-050, RN-051, RN-030.
- **Output**: docs/features/staff.md, docs/features/photographers.md.

#### W3.3 — Eligibility + Sanctions
- **Branch**: `feat/api/eligibility-sanctions`
- **Scope**: consolidar eligibility checks (apto médico vigencia anual RN-008, suspensiones RN-003, deudas pendientes RN-053), Sanctions admin completo + blacklist, attachments a MediaAsset.
- **RNs**: RN-003, RN-007, RN-008, RN-038, RN-053.
- **Output**: docs/features/eligibility.md, docs/features/sanctions.md.

#### W3.4 — Notifications wiring + Users/Profile completion
- **Branch**: `feat/api/notifications-users`
- **Scope**: subscriber pattern para emails sobre eventos (registro aprobado, partido reprogramado, deuda creada, amistoso confirmado, etc.); completar Profile (DNI validation flow stub para DP-009, apto/DDJJ versionado RN-008, role assignment RN-057).
- **RNs**: RN-008, RN-018, RN-033, RN-034, RN-035, RN-036, RN-057.
- **Output**: docs/features/users.md, docs/features/notifications.md.

---

## Coordinación de worktrees

### Asignación de modelos a olas

PR0 deja **todo el schema completo**. Las olas 1-3 **no agregan tablas nuevas** salvo casos excepcionales que se planteen como sub-PRs aparte.

### Interfaces entre features

Para evitar dependencias directas entre features (que romperían la independencia de las PRs), todas las comunicaciones entre módulos pasan por:

- **Eventos** (`@nestjs/event-emitter`) — para notificaciones, side effects.
- **Ports/interfaces** (cada feature expone sus ports en su `application/ports/`) — para llamadas síncronas necesarias.

Ej.: el módulo `Friendlies` dispara evento `friendly.played` con `{teamId, observed: true}`. El módulo `Categorization` lo escucha y actualiza el contador de observaciones del equipo. Sin import directo entre módulos.

### Reglas de PR

- **Una PR por feature**. Tamaño objetivo: 800-1500 líneas.
- **Checklist obligatorio en la PR**:
  - [ ] Tests unitarios de domain (rules + use-cases).
  - [ ] Doc en `docs/features/<entidad>.md` siguiendo plantilla.
  - [ ] Códigos de error agregados a `error-codes.ts`.
  - [ ] Eventos disparados documentados.
  - [ ] Sin `@ts-ignore` ni `any` salvo justificado.
  - [ ] Migración Prisma (si la feature requirió cambios al schema base — caso excepcional).
- **Review humano** + CI verde para mergear.

### Ramas y merges

- Cada PR apunta a `main`.
- Las PRs de la misma ola pueden mergearse en cualquier orden.
- Antes de iniciar una ola, sincronizar con main (rebase de cada worktree).

---

## Roadmap visual

```
Ola 0 (yo)         [PR0 Foundation]                      ← bloquea todo
                     │
                     ▼
Ola 1 (4 paralelo) [W1.1 Tournaments] [W1.2 Cat+Zones] [W1.3 Teams+Categ] [W1.4 Friendlies]
                     │
                     ▼ (Friendlies y Teams+Categ pueden mergearse acoplados o independientes; el resto independiente)
Ola 2 (3 paralelo) [W2.1 Debts] [W2.2 Payments] [W2.3 Pricing]
                     │
                     ▼
Ola 3 (4 paralelo) [W3.1 Playoffs] [W3.2 Staff] [W3.3 Elig+Sanctions] [W3.4 Notif+Users]
```

---

## Cobertura de RNs

Mapeo RN → Worktree responsable:

| RN | Tema | Worktree |
|----|------|----------|
| RN-001, RN-002, RN-005, RN-009 | Equipos / lista de buena fe | W1.3 |
| RN-003, RN-038 | Suspensión jugador / max equipos por torneo | W3.3 |
| RN-004 | Roster snapshot | (ya cubierto en registrations actual) |
| RN-006, RN-007 | Membresías de jugador | W1.3 + W3.3 |
| RN-008 | Apto médico / DDJJ versionado | W3.4 |
| RN-010, RN-011, RN-012 | Franquicias | W2.3 (descuento) + DP abiertos |
| RN-013, RN-014, RN-015, RN-016, RN-017, RN-018, RN-019 | Postulaciones e inscripciones | W2.2 (la mayoría ya existe; refinement) |
| RN-020, RN-021, RN-048 | Pricing y descuentos | W2.3 |
| RN-022, RN-023, RN-059 | Amistosos | W1.4 |
| RN-024, RN-049, RN-052-RN-056 | Partidos / lifecycle | W3.1 + W3.2 |
| RN-025-RN-031, RN-053 | Multas y deudas | W2.1 |
| RN-032 | Cancelación con 72hs (decisión rival) | W3.1 |
| RN-033-RN-036, RN-057 | Usuarios / DNI / roles | W3.4 |
| RN-037 | Estado activo/inactivo jugador | W3.4 (computed) |
| RN-039, RN-044 | Categorización | W1.3 |
| RN-040, RN-041 | Inscripción 1 categoría / conflicto multi-equipo | W2.2 |
| RN-042 | Late roster fee | W2.2 |
| RN-043, RN-046 | Modalidad y fechas torneo | W1.1 |
| RN-045, RN-047 | Formato torneo y playoffs | W3.1 |
| RN-050, RN-051 | Asignación staff y Drive | W3.2 |
| RN-058 | Ascensos/descensos | W3.1 (repechaje gen) + W1.3 (level update) |
| RN-060 | Auto-delete payment proof | W2.1 (cron) |

---

## Definiciones pendientes

Ver `docs/pending-decisions.md`. Las DP no bloquean el avance — cada feature implementa con un default razonable y deja el TODO marcado. Cuando se cierre la decisión, se implementa la lógica final y se cierra la DP.

DP relevantes por worktree:
- W1.1: DP-013 (umbral antelación reprogramación).
- W1.4: DP-008 (cantidad de amistosos), DP-017 (seña descuento).
- W2.1: DP-006 (50% partial), DP-007 (AJC fechas).
- W2.3: DP-011 (descuento franquicia), DP-016 (número comprobante).
- W3.1: DP-001 (default BO format), DP-005 (repechaje detalles), DP-014 (play-in detalle).
- W3.2: DP-015 (formato carpeta Drive).
- W3.3: DP-009 (mecanismo DNI).

---

## Próximos pasos

1. **Tu OK final** sobre este plan.
2. Yo ejecuto **Ola 0** (PR0 Foundation) y abro la PR para que la revises.
3. Tras merge de PR0, lanzo **Ola 1** con 4 subagentes en worktrees paralelos.
4. Cada agente abre su PR; vos revisás y mergeás.
5. Tras Ola 1 cerrada → **Ola 2** (3 subagentes).
6. Tras Ola 2 cerrada → **Ola 3** (4 subagentes).
7. Una vez todo cerrado, ola dedicada a E2E tests + hardening.
