# Backend — Propuestas de schema/datos para retirar mocks del FE

Cada mock de `apps/web/mock/` requiere un endpoint para ser retirado. Algunos endpoints se pueden implementar contra el schema actual (este doc también los documenta para tenerlos al día); otros necesitan **agregar campos / modelos nuevos en Prisma**. Este archivo concentra esas propuestas para revisión antes de migrar.

**Convención**: cada propuesta lleva un ID `BE-MOCK-XXX` para referenciarla en commits/PRs.

**Última actualización**: 2026-05-07.

> **Estado al 2026-05-07**:
> - BE-MOCK-001, 002, 003, 004 → ✅ implementados (commits `08acb5e`, `63cda63`).
> - BE-MOCK-005 → ✅ implementado (commit `6ecf276`). DP cerrada: carga manual desde admin → match detail.
> - BE-MOCK-006 → mocks huérfanos sin uso, quedan en `apps/web/mock/` como referencia.
> - Pendiente schema-side: agregar `Match.roundNumber Int?` para mejorar el agrupamiento de fixture (BE-MOCK-002 opción A) — hoy se usa `matchDate` como proxy.

---

## BE-MOCK-001 — `GET /teams/:teamId/matches?type=last|next`

**Mock que retira**: `apps/web/mock/team-matches.json` (consumido por `getMockTeamMatches` en `app/(page)/equipos/[id]/page.tsx`).

**Schema actual**: ✅ suficiente. `Match` ya tiene `homeTeamId`, `awayTeamId`, `matchDate`, `status`, `homeScore`, `awayScore`, relaciones a `category` (con `tournament`), `venue`, `homeTeam`, `awayTeam` (cada uno con `logoUrl`).

**Propuesta de implementación**: extender `TeamsService` y `TeamsController` con un método nuevo. Sin cambios de schema.

- Lógica:
  - `type=last` → último match en estado `finalizado` donde el team es home o away, ordenado `matchDate desc`.
  - `type=next` → próximo match en estado `programado` o `reprogramado`, ordenado `matchDate asc`.
  - Sin `type` → devuelve ambos en `{ lastMatch, nextMatch }`.
- Response shape — alinea con `MatchPreviewData` del FE:
  ```ts
  {
    lastMatch: MatchPreview | null,
    nextMatch: MatchPreview | null,
  }
  // donde MatchPreview = { id, tournamentSlug, categorySlug, date, location, matchType,
  //                       team1: {id, name, logoUrl}, team2: {id, name, logoUrl},
  //                       team1Score?, team2Score? }
  ```

**Sin pendientes de DB.** Implementable ya.

---

## BE-MOCK-002 — `GET /categories/:categoryId/fixture`

**Mock que retira**: `apps/web/mock/category-fixture.json` (consumido por `<FixtureView>` con shape `{ rounds: [{ name, date, matches[] }] }`).

**Gap del schema actual**: ⚠️ **falta concepto de "ronda"**. `Match` agrupa por `categoryId` y `matchDate`, pero no hay `roundNumber`. Hoy "Fecha 1 / Fecha 2 / ..." son convenciones del fixture que el BE no modela.

**Propuesta — opción A (mínima, recomendada)**: agregar columna `roundNumber: Int?` a `Match`.

```prisma
model Match {
  // ...
  matchDate     DateTime
  roundNumber   Int?       // # de fecha dentro de la liga regular (null para playoff/amistoso)
  // ...
  @@index([categoryId, roundNumber])
}
```

- Backfill inicial: agrupar matches existentes por `categoryId` y por `matchDate` ordenados, asignar `roundNumber` consecutivo (1 ronda por día único). Es heurística, pero se ajusta manualmente después.
- El generador de fixture (`fixtures` module) debe asignar `roundNumber` al crear matches.
- Endpoint groupea por `roundNumber` y arma `{ name: "Fecha N", date: <fecha más temprana del grupo>, matches[] }`.

**Propuesta — opción B (más rica, no urgente)**: nuevo modelo `MatchRound`.

```prisma
model MatchRound {
  id          String    @id @default(uuid())
  categoryId  String
  category    Category  @relation(fields: [categoryId], references: [id])
  number      Int
  name        String?   // override del nombre por defecto ("Fecha 1")
  startDate   DateTime?
  endDate     DateTime?
  matches     Match[]
  @@unique([categoryId, number])
}

model Match {
  roundId String?
  round   MatchRound? @relation(fields: [roundId], references: [id])
}
```

Permite renombrar fechas, definir ventanas, atrasar/adelantar bloques. Más caro de migrar.

**Recomendación**: A — agregar `roundNumber: Int?` ya, evolucionar a B sólo cuando aparezca el caso de uso que lo justifique.

**Implementable parcialmente sin cambios**: agrupar por `matchDate` y devolver `{ name: "matches del día <fecha>", ... }`. Funciona pero pierde semántica.

---

## BE-MOCK-003 — `GET /categories/:categoryId/standings`

**Mock que retira**: `apps/web/mock/category-standings.json` (tabla de posiciones por zona).

**Schema actual**: ✅ suficiente para computar on-the-fly.

Cálculo (FIBA, RN-018):
- Por cada `Zone` de la categoría, listar `TeamZone[]` y para cada team calcular:
  - PJ = matches finalizados donde participa
  - PG / PP = según `homeScore`/`awayScore`
  - PF = puntos a favor (suma scores propios)
  - PC = puntos en contra
  - DP = PF − PC
  - Puntos = `2 * PG + 1 * PP` (FIBA)
- Ordenar por puntos desc, luego DP desc, luego PF desc.

**Propuesta de implementación**: nuevo endpoint en `CategoriesController` con cómputo en `CategoriesService` (o use-case dedicado `ComputeCategoryStandingsUseCase` por la complejidad).

**Sin cambios de schema.** Implementable ya.

**Optimización futura (opcional)**: vista materializada o cache invalidado por evento `match.finished`. Escalas chicas (ligas barriales) no lo justifican.

---

## BE-MOCK-004 — `GET /teams/:teamId/balance`

**Mock que retira**: `apps/web/mock/team-balance.json` (consumido por `TeamBalanceService.getTeamBalance`).

**Schema actual**: ✅ suficiente. `Debt`, `Payment`, `Sanction`, `Registration` ya están todos en BE.

Shape esperado:
```ts
{
  totalDebt: number,
  totalPaid: number,
  pendingConfirmation: number,
  registrations: [{ id, tournamentName, categoryName, inscriptionAmount, insuranceAmount, playersCount, totalAmount, paidAmount, status, voucherUrl }],
  suspensions: [{ profileId, playerName, reason, totalGames, remainingGames, endDate, isActive }],
}
```

**Mapeo desde Prisma**:
- `totalDebt` = sum(`Debt.currentBalance` where `teamId=X` y `status != 'PAID'`)
- `totalPaid` = sum(`Payment.amount` where status=APPROVED y debtId asociada al team)
- `pendingConfirmation` = sum(`Payment.amount` where status=PENDING o status=VOUCHER_SUBMITTED)
- `registrations[]` = `Registration[]` del team con sus debts asociadas (inscription + insurance) + payments aplicados
- `suspensions[]` = `Sanction[]` con `targetType=PROFILE`, `kind=SUSPENSION`, joined a la profile del team

**Cálculos derivados (no en DB hoy, computar)**:
- `inscriptionAmount` y `insuranceAmount`: provienen de los Debts asociadas a la Registration (deberían tener `concept` o `type` que distinga). Ver columnas reales de Debt.
- `totalGames` / `remainingGames`: requiere campo `Sanction.fechas: { totalFechas, fechasCumplidas }` — **ya existe** según el SanctionsService FE (línea 42). ✅

**Propuesta de implementación**: use-case `GetTeamBalanceUseCase` en `application/use-cases/`, que ortega 3-4 queries (debts, payments, sanctions, registrations) y compone el read model. Adapter al teams module.

**Sin cambios de schema.** Implementable ya.

**Optimización futura**: cache por team con invalidación en eventos `payment.approved`, `debt.created`, `sanction.created`.

---

## BE-MOCK-005 — `GET /teams/:teamId/stats` y `GET /teams/:teamId/player-stats`

**Mocks que retiran**: `apps/web/mock/team-stats.json` y `apps/web/mock/player-stats.json`.

**Gap del schema**: 🚫 **bloqueado**. No existe modelo `MatchPlayerStat` en Prisma. Sin él no hay datos para agregar.

### Propuesta — modelo `MatchPlayerStat`

```prisma
model MatchPlayerStat {
  id           String   @id @default(uuid())
  matchId      String
  match        Match    @relation(fields: [matchId], references: [id])
  profileId    String   // jugador
  profile      Profile  @relation(fields: [profileId], references: [id])
  teamId       String   // team del jugador en el match (puede ser cualquiera de los dos)
  team         Team     @relation(fields: [teamId], references: [id])

  // Counts
  pt1          Int      @default(0)  // tiros libres convertidos
  pt1Att       Int      @default(0)  // tiros libres intentados
  pt2          Int      @default(0)
  pt2Att       Int      @default(0)
  pt3          Int      @default(0)
  pt3Att       Int      @default(0)
  fouls        Int      @default(0)
  steals       Int      @default(0)
  rebounds     Int      @default(0)
  assists      Int      @default(0)
  turnovers    Int      @default(0)
  blocks       Int      @default(0)

  // Computed at write time (denormalized for read perf)
  points       Int      @default(0)  // pt1 + 2*pt2 + 3*pt3

  // Lifecycle
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([matchId, profileId])
  @@index([profileId])
  @@index([teamId])
  @@index([matchId])
}

model Match {
  // ...
  playerStats  MatchPlayerStat[]
}

model Team {
  // ...
  playerStats  MatchPlayerStat[]
}

model Profile {
  // ...
  matchStats   MatchPlayerStat[]
}
```

### Endpoints derivados

- `POST /matches/:matchId/player-stats` (admin/oficial de mesa) — bulk upsert de stats post-partido.
- `GET /matches/:matchId/player-stats` — leer stats del partido (ya stub en `MatchService.getMatchPlayerStats` del FE).
- `GET /teams/:teamId/stats` — agregado del team (sumas de matches finalizados).
- `GET /teams/:teamId/player-stats` — agregado por profile dentro del team.

### Pendientes / decisiones

- **DP-NUEVA**: ¿se carga stats por partido o se calcula desde planilla (Google Drive PDF)? Si es lo segundo, primero hay que parsear PDFs.
- **Validación**: `pt1 ≤ pt1Att`, `pt1Att, pt2Att, pt3Att ≥ 0`, etc.
- **Retroactivo**: matches finalizados sin stats → quedan con `null`/0 hasta cargar manualmente.
- **Performance**: `GET /teams/:id/stats` agregando todos los matches puede ser caro. Considerar materialización vía evento `match.finished`.

**No implementable** hasta que se decida cargar stats. Propuesta queda en limbo.

---

## BE-MOCK-006 — Mocks huérfanos (sin uso activo)

Estos mocks no tienen consumidores en el código actual. **No requieren BE work hasta que el flujo se reactive**. Quedan documentados para no perderlos.

| Mock | Endpoint hipotético cuando se necesite |
|------|-------|
| `mock/admin-matches.json` | `GET /matches` ya cubre. Sin trabajo BE pendiente. |
| `mock/registration-payment-config.json` | `GET /settings/registration-fees` o derivar de site-config. |
| `mock/registration-players.json` | Extender `GET /registrations/:id` con roster pre-poblado. |
| `mock/available-players.json` | `GET /profiles/search?q=...` (público o auth-required pendiente decisión). |

---

## Resumen ejecutivo — orden recomendado de implementación

| ID | Endpoint | Cambio de schema | Esfuerzo BE | Bloquea FE |
|----|---------|------------------|-------------|------------|
| **BE-MOCK-001** | `GET /teams/:id/matches` | Ninguno | S | Alto |
| **BE-MOCK-004** | `GET /teams/:id/balance` | Ninguno | M (use-case + 3 queries) | Alto (pantalla balance) |
| **BE-MOCK-003** | `GET /categories/:id/standings` | Ninguno | M (cómputo) | Medio |
| **BE-MOCK-002** | `GET /categories/:id/fixture` | `+ Match.roundNumber Int?` | M-S | Medio (workaround fact-by-day disponible) |
| **BE-MOCK-005** | `GET /teams/:id/stats` + variants | `+ MatchPlayerStat model` | L | Bajo (placeholder UI ok) |

**Sugiero iniciar por 001 + 004 + 003** (sin schema changes) — son ganancias inmediatas. **002** se puede hacer parcial sin schema (group by date) y mejorar luego. **005** queda bloqueado hasta cerrar la decisión de carga de stats.
